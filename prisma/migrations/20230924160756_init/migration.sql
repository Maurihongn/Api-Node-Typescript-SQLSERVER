/*
  Warnings:

  - The primary key for the `ActivationCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `codeID` on the `ActivationCode` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `ActivationCode` table. All the data in the column will be lost.
  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoryID` on the `Category` table. All the data in the column will be lost.
  - The primary key for the `Item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoryID` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `itemID` on the `Item` table. All the data in the column will be lost.
  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `orderID` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderStatusID` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `Order` table. All the data in the column will be lost.
  - The primary key for the `OrderItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `itemID` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `orderID` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `orderItemID` on the `OrderItem` table. All the data in the column will be lost.
  - The primary key for the `OrderStatus` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `orderStatusID` on the `OrderStatus` table. All the data in the column will be lost.
  - The primary key for the `Reservation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `reservationID` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `reservationStatusID` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `Reservation` table. All the data in the column will be lost.
  - The primary key for the `ReservationStatus` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `reservationStatusID` on the `ReservationStatus` table. All the data in the column will be lost.
  - The primary key for the `Role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `roleID` on the `Role` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `roleID` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `ActivationCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ActivationCode" DROP CONSTRAINT "ActivationCode_userID_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_categoryID_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_orderStatusID_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userID_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_itemID_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderID_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_reservationStatusID_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_userID_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleID_fkey";

-- AlterTable
ALTER TABLE "ActivationCode" DROP CONSTRAINT "ActivationCode_pkey",
DROP COLUMN "codeID",
DROP COLUMN "userID",
ADD COLUMN     "codeId" SERIAL NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "ActivationCode_pkey" PRIMARY KEY ("codeId");

-- AlterTable
ALTER TABLE "Category" DROP CONSTRAINT "Category_pkey",
DROP COLUMN "categoryID",
ADD COLUMN     "categoryId" SERIAL NOT NULL,
ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryId");

-- AlterTable
ALTER TABLE "Item" DROP CONSTRAINT "Item_pkey",
DROP COLUMN "categoryID",
DROP COLUMN "itemID",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD COLUMN     "itemId" SERIAL NOT NULL,
ADD CONSTRAINT "Item_pkey" PRIMARY KEY ("itemId");

-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "orderID",
DROP COLUMN "orderStatusID",
DROP COLUMN "userID",
ADD COLUMN     "orderId" SERIAL NOT NULL,
ADD COLUMN     "orderStatusId" INTEGER,
ADD COLUMN     "userId" INTEGER,
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("orderId");

-- AlterTable
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_pkey",
DROP COLUMN "itemID",
DROP COLUMN "orderID",
DROP COLUMN "orderItemID",
ADD COLUMN     "itemId" INTEGER NOT NULL,
ADD COLUMN     "orderId" INTEGER NOT NULL,
ADD COLUMN     "orderItemId" SERIAL NOT NULL,
ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("orderItemId");

-- AlterTable
ALTER TABLE "OrderStatus" DROP CONSTRAINT "OrderStatus_pkey",
DROP COLUMN "orderStatusID",
ADD COLUMN     "orderStatusId" SERIAL NOT NULL,
ADD CONSTRAINT "OrderStatus_pkey" PRIMARY KEY ("orderStatusId");

-- AlterTable
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_pkey",
DROP COLUMN "reservationID",
DROP COLUMN "reservationStatusID",
DROP COLUMN "userID",
ADD COLUMN     "reservationId" SERIAL NOT NULL,
ADD COLUMN     "reservationStatusId" INTEGER,
ADD COLUMN     "userId" INTEGER,
ADD CONSTRAINT "Reservation_pkey" PRIMARY KEY ("reservationId");

-- AlterTable
ALTER TABLE "ReservationStatus" DROP CONSTRAINT "ReservationStatus_pkey",
DROP COLUMN "reservationStatusID",
ADD COLUMN     "reservationStatusId" SERIAL NOT NULL,
ADD CONSTRAINT "ReservationStatus_pkey" PRIMARY KEY ("reservationStatusId");

-- AlterTable
ALTER TABLE "Role" DROP CONSTRAINT "Role_pkey",
DROP COLUMN "roleID",
ADD COLUMN     "roleId" SERIAL NOT NULL,
ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("roleId");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "roleID",
DROP COLUMN "userID",
ADD COLUMN     "roleId" INTEGER,
ADD COLUMN     "userId" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("userId");

-- AddForeignKey
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_orderStatusId_fkey" FOREIGN KEY ("orderStatusId") REFERENCES "OrderStatus"("orderStatusId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("itemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_reservationStatusId_fkey" FOREIGN KEY ("reservationStatusId") REFERENCES "ReservationStatus"("reservationStatusId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("roleId") ON DELETE SET NULL ON UPDATE CASCADE;
