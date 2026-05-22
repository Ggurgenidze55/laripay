import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RequestWithAuth } from '../../common/types/request.types';
import { TokensService } from './tokens.service';

@ApiTags('tokens')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/tokens')
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  @Post('cards')
  tokenize(@Req() req: RequestWithAuth, @Body() body: Record<string, unknown>) {
    return this.tokens.tokenizeCard(req.merchantId!, body as Parameters<TokensService['tokenizeCard']>[1]);
  }
}
