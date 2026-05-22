import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, body: { email?: string; name?: string; phone?: string; metadata?: object }) {
    return this.prisma.customer.create({
      data: {
        merchantId,
        email: body.email,
        name: body.name,
        phone: body.phone,
        metadata: body.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async list(merchantId: string) {
    return this.prisma.customer.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async get(merchantId: string, id: string) {
    const c = await this.prisma.customer.findFirst({ where: { id, merchantId } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }
}
