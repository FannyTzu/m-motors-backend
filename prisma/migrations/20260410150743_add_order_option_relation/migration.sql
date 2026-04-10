-- CreateTable
CREATE TABLE "OrderOption" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "option_id" INTEGER NOT NULL,

    CONSTRAINT "OrderOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderOption_order_id_option_id_key" ON "OrderOption"("order_id", "option_id");

-- AddForeignKey
ALTER TABLE "OrderOption" ADD CONSTRAINT "OrderOption_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderOption" ADD CONSTRAINT "OrderOption_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
