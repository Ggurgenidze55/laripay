"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'public'), { prefix: '/sdk' });
    app.setGlobalPrefix('api');
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: config.get('corsOrigins'),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    const swagger = new swagger_1.DocumentBuilder()
        .setTitle('LariPay Core API')
        .setDescription('LariPay enterprise API — checkout (redirect/embedded/direct), open banking, wallets, subscriptions, fraud, webhooks')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'Authorization', in: 'header' }, 'api-key')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swagger);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = config.get('port') || 4000;
    await app.listen(port);
    console.log(`LariPay Core listening on http://localhost:${port}/api (docs: /docs)`);
}
bootstrap();
//# sourceMappingURL=main.js.map