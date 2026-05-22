import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request } from 'express';
import { JwtPayload } from '../../common/types/request.types';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('merchants')
  listMerchants() {
    return this.admin.listMerchants();
  }

  @Patch('merchants/:id/approve')
  approve(
    @Req() req: Request & { user: JwtPayload & { userId: string } },
    @Param('id') id: string,
  ) {
    return this.admin.approveMerchant(id, req.user.userId);
  }

  @Get('payments')
  listPayments() {
    return this.admin.listPayments();
  }

  @Get('audit-logs')
  auditLogs() {
    return this.admin.listAuditLogs();
  }

  @Get('disputes')
  disputes() {
    return this.admin.listDisputes();
  }

  @Get('fraud')
  fraud() {
    return this.admin.listFraudChecks();
  }
}
