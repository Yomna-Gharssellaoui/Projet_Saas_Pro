import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { InvoiceChatbotService } from "../invoice-chatbot/invoice-chatbot.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BusinessAccessGuard } from "../../common/guards/business-access.guard";
import { BusinessId } from "../../common/decorators/business-id.decorator";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@Controller("invoices")
export class InvoicesController {
  constructor(
    private readonly s: InvoicesService,
    private readonly chatbot: InvoiceChatbotService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@Body() body: { message: string }) {
    return this.chatbot.chat(body.message);
  }

  @Get('hello')
  hello() {
    return { status: 'invoices module is alive' };
  }

  @UseGuards(JwtAuthGuard, BusinessAccessGuard, PermissionsGuard)
  @Post('protected-test')
  test() { return { ok: true }; }


  @Post()
  @RequirePermissions("invoices:write")
  create(@BusinessId() businessId: string, @Body() dto: CreateInvoiceDto) {
    return this.s.create(businessId, dto);
  }

  @Get()
  @RequirePermissions("invoices:read")
  findAll(@BusinessId() businessId: string) {
    return this.s.findAll(businessId);
  }

  @Get(":id")
  @RequirePermissions("invoices:read")
  findOne(@BusinessId() businessId: string, @Param("id") id: string) {
    return this.s.findOne(businessId, id);
  }

  @Patch(":id")
  @RequirePermissions("invoices:update")
  update(@BusinessId() businessId: string, @Param("id") id: string, @Body() dto: UpdateInvoiceDto) {
    return this.s.update(businessId, id, dto);
  }

  @Delete(":id")
  @RequirePermissions("invoices:delete")
  remove(@BusinessId() businessId: string, @Param("id") id: string) {
    return this.s.remove(businessId, id);
  }
}