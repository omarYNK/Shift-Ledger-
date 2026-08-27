-- DropForeignKey
ALTER TABLE "fixed_items" DROP CONSTRAINT "fixed_items_client_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_client_id_fkey";

-- DropForeignKey
ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_client_id_fkey";

-- DropIndex
DROP INDEX "invoices_client_id_period_start_period_end_version_key";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "archived_at";

-- AlterTable
ALTER TABLE "fixed_items" ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "employee_name" TEXT,
ALTER COLUMN "client_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "client_name" TEXT NOT NULL,
ALTER COLUMN "client_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "time_entries" ALTER COLUMN "client_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "fixed_items_employee_id_date_idx" ON "fixed_items"("employee_id", "date");

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_items" ADD CONSTRAINT "fixed_items_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_items" ADD CONSTRAINT "fixed_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

