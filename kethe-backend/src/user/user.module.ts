import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { TypeOrmUserRepository } from './repositories/typeorm-user.repository'
import { UserRepository } from './repositories/user.repository'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { Account } from './entities/account.entity'
import { Category } from './entities/category.entity'
import { DefaultUserDataService } from './default-user-data.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, Account])],
  controllers: [UserController],
  providers: [
    UserService,
    DefaultUserDataService,
    {
      provide: UserRepository,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [UserService, UserRepository, DefaultUserDataService],
})
export class UserModule {}
