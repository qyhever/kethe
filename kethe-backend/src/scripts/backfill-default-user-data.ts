import { DataSource } from 'typeorm'
import { DefaultUserDataService } from '../user/default-user-data.service'
import { Account } from '../user/entities/account.entity'
import { Category } from '../user/entities/category.entity'
import { User } from '../user/entities/user.entity'

async function main() {
  process.loadEnvFile?.('.env')
  const required = (name: string): string => {
    const value = process.env[name]
    if (!value) throw new Error(`缺少环境变量 ${name}`)
    return value
  }
  const dataSource = await new DataSource({
    type: 'mysql',
    host: required('DB_HOST'),
    port: Number(required('DB_PORT')),
    username: required('DB_USERNAME'),
    password: required('DB_PASSWORD'),
    database: required('DB_DATABASE'),
    timezone: 'Z',
    synchronize: false,
    entities: [User, Category, Account],
  }).initialize()
  try {
    const defaults = new DefaultUserDataService()
    const users = await dataSource
      .getRepository(User)
      .find({ select: { id: true } })
    for (const user of users) {
      await dataSource.transaction((manager) =>
        defaults.initialize(user.id, manager),
      )
    }
    console.log(`默认分类和账户回填完成，共处理 ${users.length} 个用户`)
  } finally {
    await dataSource.destroy()
  }
}

main().catch((error: unknown) => {
  console.error('默认数据回填失败', error)
  process.exitCode = 1
})
