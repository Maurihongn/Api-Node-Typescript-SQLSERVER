-- CreateTable
CREATE TABLE "ActivationCode" (
    "CodeID" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "Code" TEXT NOT NULL,
    "IsUsed" BOOLEAN,

    CONSTRAINT "ActivationCode_pkey" PRIMARY KEY ("CodeID")
);

-- CreateTable
CREATE TABLE "Category" (
    "CategoryID" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "CreationDate" TIMESTAMP(3),
    "IsActive" BOOLEAN,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("CategoryID")
);

-- CreateTable
CREATE TABLE "Item" (
    "ItemID" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Price" DOUBLE PRECISION NOT NULL,
    "IsActive" BOOLEAN NOT NULL,
    "Description" TEXT,
    "CreationDate" TIMESTAMP(3),
    "CategoryID" INTEGER NOT NULL,
    "ItemImage" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("ItemID")
);

-- CreateTable
CREATE TABLE "Order" (
    "OrderID" SERIAL NOT NULL,
    "TableNumber" INTEGER NOT NULL,
    "OrderStatusID" INTEGER,
    "NumberOfPeople" INTEGER,
    "CreationDate" TIMESTAMP(3),
    "UserID" INTEGER,
    "TotalPrice" DOUBLE PRECISION,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("OrderID")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "OrderItemID" SERIAL NOT NULL,
    "OrderID" INTEGER NOT NULL,
    "ItemID" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "UnitPrice" DOUBLE PRECISION NOT NULL,
    "TotalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("OrderItemID")
);

-- CreateTable
CREATE TABLE "OrderStatus" (
    "OrderStatusID" SERIAL NOT NULL,
    "StatusName" TEXT NOT NULL,

    CONSTRAINT "OrderStatus_pkey" PRIMARY KEY ("OrderStatusID")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "ReservationID" SERIAL NOT NULL,
    "ReservationDate" TIMESTAMP(3),
    "ReservationStatusID" INTEGER,
    "UserID" INTEGER,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("ReservationID")
);

-- CreateTable
CREATE TABLE "ReservationStatus" (
    "ReservationStatusID" SERIAL NOT NULL,
    "StatusName" TEXT NOT NULL,

    CONSTRAINT "ReservationStatus_pkey" PRIMARY KEY ("ReservationStatusID")
);

-- CreateTable
CREATE TABLE "Role" (
    "RoleID" SERIAL NOT NULL,
    "RoleName" TEXT NOT NULL,
    "RoleValue" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("RoleID")
);

-- CreateTable
CREATE TABLE "User" (
    "UserID" SERIAL NOT NULL,
    "Email" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "ProfileImage" TEXT,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Address" TEXT,
    "Phone" TEXT,
    "BirthDate" TIMESTAMP(3),
    "HireDate" TIMESTAMP(3),
    "RoleID" INTEGER,
    "Salary" DOUBLE PRECISION,
    "IsActive" BOOLEAN,

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- AddForeignKey
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_CategoryID_fkey" FOREIGN KEY ("CategoryID") REFERENCES "Category"("CategoryID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_OrderStatusID_fkey" FOREIGN KEY ("OrderStatusID") REFERENCES "OrderStatus"("OrderStatusID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Order"("OrderID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_ItemID_fkey" FOREIGN KEY ("ItemID") REFERENCES "Item"("ItemID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_ReservationStatusID_fkey" FOREIGN KEY ("ReservationStatusID") REFERENCES "ReservationStatus"("ReservationStatusID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_RoleID_fkey" FOREIGN KEY ("RoleID") REFERENCES "Role"("RoleID") ON DELETE SET NULL ON UPDATE CASCADE;
