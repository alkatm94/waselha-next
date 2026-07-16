import { prisma } from "@/lib/prisma";

export async function getChinaWarehouseSettings() {
  return prisma.warehouseSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      recipientName: "David",
      phone: "18973580329",
      chineseAddress: "广东省深圳市宝安区福永街道福围社区广厦路27号，纵横天下",
      englishAddress: "No. 27, Guangxia Road, Fuwei Community, Fuyong Street, Baoan District, Shenzhen City, Guangdong Province, China",
      city: "Shenzhen",
      province: "Guangdong",
    },
  });
}
