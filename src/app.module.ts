import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'sa',
      database: 'nest-db',
      autoLoadEntities: false,
      synchronize: false,
    }),
    ThrottlerModule.forRoot({
      ttl: 30,
      limit: 50,
    }),
    UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
