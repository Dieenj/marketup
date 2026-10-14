-- Phóng to ảnh banner (%, 100 = vừa khung): phóng to thì kéo chỉnh được cả ngang lẫn dọc
ALTER TABLE "shops" ADD COLUMN "bannerZoom" INTEGER NOT NULL DEFAULT 100;
