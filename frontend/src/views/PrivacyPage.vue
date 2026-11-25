<template>
  <article class="page">
    <h1 class="h1">{{ copy.title }}</h1>
    <p class="lead">{{ copy.lead }}</p>
    <section v-for="sec in copy.sections" :key="sec.h" class="sec">
      <h2 class="h2">{{ sec.h }}</h2>
      <ul>
        <li v-for="item in sec.items" :key="item">{{ item }}</li>
      </ul>
    </section>
    <p class="contact">
      {{ copy.contact }}
      <RouterLink :to="{ name: 'contact' }">{{ copy.contactLink }}</RouterLink>.
    </p>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from '../i18n'

const { locale } = useI18n()

// Describes what this store's system actually stores and does.
const en = {
  title: 'Privacy policy',
  lead: 'This page explains what information Al-Wakeel Al-Shamel keeps when you use the store, and why.',
  sections: [
    {
      h: 'What we keep',
      items: [
        'Your account details: name, email address, phone number and delivery address.',
        'Your orders: the products, amounts, payment method, order status and invoices.',
        'Reviews you write, shown publicly with your first name and the first letter of your last name.',
      ],
    },
    {
      h: 'Payments',
      items: [
        'Card details are sent securely to process the payment and are not stored by the store.',
        'For cash on delivery, you pay the courier when your order arrives.',
      ],
    },
    {
      h: 'How we use it',
      items: [
        'To deliver your orders, send order confirmations and invoices by email, and show your order history.',
        'Staff see only what they need: sales staff handle orders, the warehouse manages stock, the admin manages the store.',
        'Questions you type into the store assistant are sent to an AI service to write the reply. Do not type passwords or card numbers there.',
      ],
    },
    {
      h: 'Your choices',
      items: [
        'You can update your name, phone number, address and password from your profile at any time.',
        'Your sign-in is kept on this device until you sign out.',
      ],
    },
  ],
  contact: 'Questions about your data? ',
  contactLink: 'Contact us',
}

const ar = {
  title: 'سياسة الخصوصية',
  lead: 'توضح هذه الصفحة المعلومات التي يحتفظ بها متجر الوكيل الشامل عند استخدامك للمتجر وسبب ذلك.',
  sections: [
    {
      h: 'ما نحتفظ به',
      items: [
        'بيانات حسابك: الاسم والبريد الإلكتروني ورقم الجوال وعنوان التوصيل.',
        'طلباتك: المنتجات والمبالغ وطريقة الدفع وحالة الطلب والفواتير.',
        'التقييمات التي تكتبها، وتظهر للجميع باسمك الأول وأول حرف من اسم العائلة.',
      ],
    },
    {
      h: 'الدفع',
      items: [
        'تُرسل بيانات البطاقة بشكل آمن لإتمام الدفع ولا يحتفظ بها المتجر.',
        'في الدفع عند الاستلام، تدفع لمندوب التوصيل عند وصول طلبك.',
      ],
    },
    {
      h: 'كيف نستخدمها',
      items: [
        'لتوصيل طلباتك، وإرسال تأكيد الطلب والفاتورة على بريدك، وعرض سجل طلباتك.',
        'يرى الموظفون ما يحتاجونه فقط: موظفو المبيعات للطلبات، والمستودع للمخزون، والإدارة لإدارة المتجر.',
        'الأسئلة التي تكتبها لمساعد المتجر تُرسل إلى خدمة ذكاء اصطناعي لكتابة الرد، فلا تكتب فيها كلمات مرور أو أرقام بطاقات.',
      ],
    },
    {
      h: 'خياراتك',
      items: [
        'تقدر تعدّل اسمك ورقم جوالك وعنوانك وكلمة المرور من صفحة حسابك في أي وقت.',
        'يبقى تسجيل دخولك محفوظًا على هذا الجهاز حتى تسجّل الخروج.',
      ],
    },
  ],
  contact: 'عندك سؤال عن بياناتك؟ ',
  contactLink: 'تواصل معنا',
}

const copy = computed(() => (locale.value === 'ar' ? ar : en))
</script>

<style scoped>
.page {
  max-width: 780px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 32px 30px;
}
.h1 {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
}
.lead {
  color: var(--text);
  line-height: 1.8;
  margin: 0 0 18px;
}
.h2 {
  margin: 18px 0 8px;
  font-family: var(--font-head);
  font-size: 19px;
  color: var(--gold-text);
}
ul {
  margin: 0;
  padding-inline-start: 22px;
  display: grid;
  gap: 6px;
  line-height: 1.8;
}
.contact {
  margin: 22px 0 0;
  color: var(--text);
}
.contact a {
  color: var(--gold-text);
  font-weight: 600;
}
@media (max-width: 560px) {
  .page {
    padding: 22px 18px;
  }
}
</style>
