import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cinema API')
    .setDescription(
      'REST API кінотеатру: фільми, зали, сеанси та бронювання. ' +
        'ДЗ №1 курсу «Back-end розробка з Node.js (NestJS)». ' +
        'Дані зберігаються в памʼяті процесу та зникають після перезапуску.',
    )
    .setVersion('1.0')
    .addTag('films', 'Фільми')
    .addTag('halls', 'Зали та їхні місця')
    .addTag('showings', 'Сеанси та схема місць')
    .addTag('bookings', 'Бронювання')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  console.log(`Cinema API is running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

void bootstrap();
