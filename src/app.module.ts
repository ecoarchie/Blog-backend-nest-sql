import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

const { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } =
  process.env;

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`,
      ssl: true,
      // host: process.env.HOST || 'localhost',
      // port: 5432,
      // username: process.env.DB_USERNAME || 'postgres',
      // password: process.env.DB_PASS || 'sa',
      // database: process.env.DB_NAME || 'nest-db',
      autoLoadEntities: false,
      synchronize: false,
    }),
    ThrottlerModule.forRoot({
      ttl: 30,
      limit: 50,
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
