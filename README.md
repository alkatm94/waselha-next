# وصلها لي

موقع Next.js عربي لخدمة وسيط طلب المنتجات من الخارج إلى السعودية. يتيح للعميل إرسال رابط المنتج، حساب تقدير مبدئي، والتواصل عبر واتساب لمراجعة السعر قبل الشراء.

## المتطلبات

- Node.js 18 أو أحدث
- npm

## طريقة التشغيل محليًا

```bash
npm install
npm run dev
```

افتح المتصفح على:

```text
http://localhost:3000
```

## متغيرات البيئة

انسخ ملف المثال:

```bash
cp .env.example .env
```

ثم عدّل القيم حسب بيئة التشغيل:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_WHATSAPP_NUMBER="966500000000"
```

## Prisma

عند الحاجة لتجهيز قاعدة البيانات المحلية:

```bash
npx prisma generate
npm run db:push
```

## أوامر مفيدة

```bash
npm run dev
npm run build
npm run start
```

## النشر

يمكن ربط المشروع مع Vercel أو Netlify من GitHub. تأكد من إضافة متغيرات البيئة في لوحة التحكم الخاصة بالمنصة قبل النشر.
