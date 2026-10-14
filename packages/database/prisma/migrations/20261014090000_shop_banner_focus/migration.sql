-- Vị trí ảnh banner trong khung storefront (người bán kéo chỉnh ở Settings)
ALTER TABLE "shops" ADD COLUMN "bannerFocusX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "bannerFocusY" INTEGER NOT NULL DEFAULT 50;
