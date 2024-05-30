  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-nocheck
  import { Sequelize, Options as SequelizeOptions } from 'sequelize';
  import serverless from 'serverless-http';
  import { NestFactory } from '@nestjs/core';
  import serverless from 'serverless-http';
  import { AppModule } from './app.module';

  import helmet = require('helmet');

  const sequelizeConfig: SequelizeOptions = {
    host: process.env.DBHOST,
    dialect: 'postgres',
    port: Number(process.env.DBPORT),
    ssl: true,
    dialectOptions: {
      ssl: { 
        require: true,
        rejectUnauthorized: false  // ignore authorization
      },
    }
  };

  const dataBaseBootstrap = async () => {
    const sequelize = new Sequelize(
      process.env.DBNAME || '',
      process.env.USER || '',
      process.env.PASSWORD || '',
      sequelizeConfig,
    );

    await sequelize
    .authenticate()
    .then(() => {
      console.log('Connection has been established successfully.');
    })
    .catch(error => {
      console.error('Unable to connect to the database:', error);
    });
  };

  async function bootstrap() {
    await dataBaseBootstrap();
    const  app  = await NestFactory.create(AppModule);

    app.enableCors({
      origin: (req, callback) => callback(null, true),
    });
    app.use(helmet());

    //serverless
    await app.init();
    const expressApp = await app.getHttpAdapter().getInstance();

    // await app.listen(port);
    console.log('before serverless');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return serverless(expressApp, { provider: 'aws' });
  }

  let serverlessHandler: serverless.Handler;
  export const handler = async (event?, context?) => {
    try {
      console.log('Handler Started Bootstrap');
      console.log('Connection has been established successfully.');
      serverlessHandler = serverlessHandler ?? (await bootstrap());
      console.log(`App is Ready`);
      const result = await serverlessHandler(event, context);

      return result;
    } catch (error) {
      console.log(
        'Boostrap failed',
        error,
        (error as { message?: string })?.message,
      );

      return {
        statusCode: 400,
        body: JSON.stringify({
          errorMessage: 'app bootstrap failed',
        }),
      };
    }
  };