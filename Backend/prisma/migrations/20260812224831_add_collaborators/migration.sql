-- CreateTable
CREATE TABLE "_SharedCanvases" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SharedCanvases_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SharedCanvases_B_index" ON "_SharedCanvases"("B");

-- AddForeignKey
ALTER TABLE "_SharedCanvases" ADD CONSTRAINT "_SharedCanvases_A_fkey" FOREIGN KEY ("A") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedCanvases" ADD CONSTRAINT "_SharedCanvases_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
