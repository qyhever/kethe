# 忘记密码与重置密码

- 未登录用户从登录页「忘记密码？」进入 `/forgot-password`，页面组件为 `ForgotPasswordPage`，用户填写邮箱、六位邮箱验证码、新密码和确认密码。原 `/reset-password` 路径重定向至 `/forgot-password`，兼容旧入口。
- 登录用户按「我的 → 设置 → 账号与安全 → 重置密码」进入 `/profile/settings/security/reset-password`，页面组件为 `ResetPasswordPage`。设置和账号与安全的路径分别为 `/profile/settings`、`/profile/settings/security`，均需登录。
- 重置密码页面自动展示当前登录用户的绑定邮箱，邮箱只读。用户填写六位邮箱验证码、新密码和确认密码。邮箱信息缺失或无效时提示重新登录，并禁用发送验证码和提交按钮。
- 两种流程共用表单与现有 `/auth/password-reset-code`、`/auth/reset-password` 接口，验证码发送后倒计时 60 秒，新密码至少 8 位，两次密码必须一致；请求失败时保留表单并提示错误。
- 重置成功后提示重新登录；登录后的重置流程同时清除本地登录状态和令牌，并跳转登录页。返回按钮按来源分别回到账号与安全或登录页。
