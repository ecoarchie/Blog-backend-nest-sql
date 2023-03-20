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
      // url: `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}`,
      host: process.env.PGHOST || 'localhost',
      port: 5432,
      username: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'sa',
      database: process.env.PGDATABASE || 'nest-db',
      ssl: true,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
