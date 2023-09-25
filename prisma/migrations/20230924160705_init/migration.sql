-- CreateTable
CREATE TABLE "ActivationCode" (
    "codeID" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN,

    CONSTRAINT "ActivationCode_pkey" PRIMARY KEY ("codeID")
);

-- CreateTable
CREATE TABLE "Category" (
    "categoryID" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creationDate" TIMESTAMP(3),
    "isActive" BOOLEAN,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryID")
);

-- CreateTable
CREATE TABLE "Item" (
    "itemID" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "description" TEXT,
    "creationDate" TIMESTAMP(3),
    "categoryID" INTEGER NOT NULL,
    "itemImage" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("itemID")
);

-- CreateTable
CREATE TABLE "Order" (
    "orderID" SERIAL NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "orderStatusID" INTEGER,
    "numberOfPeople" INTEGER,
    "creationDate" TIMESTAMP(3),
    "userID" INTEGER,
    "totalPrice" DOUBLE PRECISION,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("orderID")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "orderItemID" SERIAL NOT NULL,
    "orderID" INTEGER NOT NULL,
    "itemID" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("orderItemID")
);

-- CreateTable
CREATE TABLE "OrderStatus" (
    "orderStatusID" SERIAL NOT NULL,
    "statusName" TEXT NOT NULL,

    CONSTRAINT "OrderStatus_pkey" PRIMARY KEY ("orderStatusID")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "reservationID" SERIAL NOT NULL,
    "reservationDate" TIMESTAMP(3),
    "reservationStatusID" INTEGER,
    "userID" INTEGER,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("reservationID")
);

-- CreateTable
CREATE TABLE "ReservationStatus" (
    "reservationStatusID" SERIAL NOT NULL,
    "statusName" TEXT NOT NULL,

    CONSTRAINT "ReservationStatus_pkey" PRIMARY KEY ("reservationStatusID")
);

-- CreateTable
CREATE TABLE "Role" (
    "roleID" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,
    "roleValue" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleID")
);

-- CreateTable
CREATE TABLE "User" (
    "userID" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profileImage" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3),
    "roleID" INTEGER,
    "salary" DOUBLE PRECISION,
    "isActive" BOOLEAN,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES "Category"("categoryID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_orderStatusID_fkey" FOREIGN KEY ("orderStatusID") REFERENCES "OrderStatus"("orderStatusID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "Order"("orderID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_itemID_fkey" FOREIGN KEY ("itemID") REFERENCES "Item"("itemID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_reservationStatusID_fkey" FOREIGN KEY ("reservationStatusID") REFERENCES "ReservationStatus"("reservationStatusID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Role"("roleID") ON DELETE SET NULL ON UPDATE CASCADE;
