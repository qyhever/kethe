#!/usr/bin/env bash
# Export one user's data from MySQL on Rocky Linux.
# Keep writes for this user and changes to schema/dictionaries paused throughout.
set -Eeuo pipefail
umask 077

if [[ $# -lt 2 || $# -gt 4 ]]; then
  echo "Usage: $0 USER_ID OUTPUT_DIRECTORY [DATABASE=kethe] [LOGIN_PATH=kethe-prod]" >&2
  exit 1
fi

user_id=$1
output_dir=$2
database=${3:-kethe}
login_path=${4:-kethe-prod}
[[ $user_id =~ ^[1-9][0-9]*$ ]] || { echo 'Invalid user ID' >&2; exit 1; }
[[ $database =~ ^[a-zA-Z0-9_]+$ ]] || { echo 'Invalid database name' >&2; exit 1; }
for command_name in mysql mysqldump sha256sum; do
  command -v "$command_name" >/dev/null || { echo "Missing command: $command_name" >&2; exit 1; }
done

# Refuse an existing directory to avoid overwriting a previous export.
mkdir -- "$output_dir"
output_dir=$(cd -- "$output_dir" && pwd)
trap 'echo "Export failed. Incomplete directory: $output_dir (do not import it)." >&2' ERR

dictionary_tables=(icon_resources icon_scene_options account_icon_rules)
user_tables=(categories accounts members expense_projects merchants transactions feedbacks)
mysql_options=("--login-path=$login_path" --default-character-set=utf8mb4 "--database=$database" --batch --skip-column-names)
dump_options=("--login-path=$login_path" --default-character-set=utf8mb4 --single-transaction --skip-lock-tables --no-tablespaces --set-gtid-purged=OFF --skip-triggers)

# The business-icon migration drops category_icons. Export it only when a legacy
# base table remains; a compatibility view must not be treated as a table.
legacy_icon_table=$(mysql "${mysql_options[@]}" --execute="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='category_icons' AND table_type='BASE TABLE'")
if [[ $legacy_icon_table == 1 ]]; then
  dictionary_tables=(category_icons "${dictionary_tables[@]}")
else
  echo 'Legacy category_icons table is absent; exporting current icon dictionaries only.'
fi
all_tables=(users "${dictionary_tables[@]}" "${user_tables[@]}")

user_count=$(mysql "${mysql_options[@]}" --execute="SELECT COUNT(*) FROM users WHERE id=$user_id")
[[ $user_count == 1 ]] || { echo 'Expected exactly one matching user' >&2; exit 1; }

count_sql="SELECT 'users', COUNT(*) FROM users WHERE id=$user_id"
for table_name in "${user_tables[@]}"; do
  count_sql+=" UNION ALL SELECT '$table_name', COUNT(*) FROM $table_name WHERE userId=$user_id"
done
for table_name in "${dictionary_tables[@]}"; do
  count_sql+=" UNION ALL SELECT '$table_name', COUNT(*) FROM $table_name"
done

echo 'Keep user writes and schema/dictionary changes paused until this script finishes.'
mysql "${mysql_options[@]}" --execute="$count_sql" > "$output_dir/counts.tsv"

mysqldump "${dump_options[@]}" --no-data \
  "--result-file=$output_dir/01-schema.sql" "$database" "${all_tables[@]}"
mysqldump "${dump_options[@]}" --no-create-info --skip-add-locks --complete-insert \
  "--result-file=$output_dir/02-dictionaries.sql" "$database" "${dictionary_tables[@]}"
mysqldump "${dump_options[@]}" --no-create-info --skip-add-locks --complete-insert \
  "--where=id=$user_id" "--result-file=$output_dir/03-user.sql" "$database" users
mysqldump "${dump_options[@]}" --no-create-info --skip-add-locks --complete-insert \
  "--where=userId=$user_id" "--result-file=$output_dir/04-business.sql" "$database" "${user_tables[@]}"

printf '%s\n' "$user_id" > "$output_dir/user-id.txt"
# This detects row-count changes, but cannot detect updates to existing rows.
after_counts=$(mysql "${mysql_options[@]}" --execute="$count_sql")
[[ $(cat "$output_dir/counts.tsv") == "$after_counts" ]] || {
  echo 'Row counts changed during export. Pause writes and export again.' >&2
  exit 1
}

# The manifest is written only after all exports and checks succeed.
(
  cd -- "$output_dir"
  sha256sum 01-schema.sql 02-dictionaries.sql 03-user.sql 04-business.sql counts.tsv user-id.txt > SHA256SUMS
)
echo "Export complete: $output_dir"
