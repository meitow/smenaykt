import { PrismaClient } from "@prisma/client";
import { combineDateAndTime, formatScheduleLabel } from "../lib/datetime";

const prisma = new PrismaClient();

function dateAt(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(12, 0, 0, 0);
  return date;
}

function dateValue(daysFromNow: number) {
  const date = dateAt(daysFromNow);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function main() {
  await prisma.review.deleteMany();
  await prisma.taskMessage.deleteMany();
  await prisma.taskChatReadState.deleteMany();
  await prisma.task.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.store.deleteMany();

  await prisma.userProfile.createMany({
    data: [
      {
        phone: "+79991234567",
        name: "Айаал",
        bio: "Помогаю с двором и льдом, свободен по выходным.",
      },
      {
        phone: "+79997654321",
        name: "Сардана",
        bio: "Быстро и аккуратно, есть опыт домашних задач.",
      },
      {
        phone: "+79995556677",
        name: "Максим",
        bio: "Студент, подрабатываю на сменах и поручениях.",
      },
    ],
  });

  const storeA = await prisma.store.create({
    data: {
      name: "Предприятие (центр)",
      inviteCode: "YKT-DEMO-1",
      accessToken: "yktDemoPartner0000001",
      phone: "+79990001122",
    },
  });

  await prisma.store.create({
    data: {
      name: "Предприятие (мкр 203)",
      inviteCode: "YKT-DEMO-2",
      accessToken: "yktDemoPartner0000002",
      phone: "+79990003344",
    },
  });

  const openIce = await prisma.task.create({
    data: {
      source: "person",
      category: "personal",
      durationHours: 2,
      title: "Помочь занести лёд в погреб",
      description: "Лёд уже куплен, нужно занести в погреб во дворе.\nКалитка с торца.",
      pay: 2500,
      place: "Мкр 203",
      timeLabel: formatScheduleLabel(dateValue(0), "14:00", "16:00"),
      scheduledAt: combineDateAndTime(dateValue(0), "14:00")!,
      emoji: "🧊",
      lmkRequired: false,
      phone: "+79991234567",
    },
  });

  await prisma.task.create({
    data: {
      source: "person",
      category: "personal",
      durationHours: 3,
      title: "Убрать двор после снегопада",
      description: "Убрать снег с дорожки и у калитки.\nЛопата есть. Двор небольшой.",
      pay: 3000,
      place: "Сайыс",
      timeLabel: formatScheduleLabel(dateValue(1), "10:00", "13:00"),
      scheduledAt: combineDateAndTime(dateValue(1), "10:00")!,
      emoji: "❄️",
      lmkRequired: false,
      phone: "+79997654321",
    },
  });

  await prisma.task.create({
    data: {
      source: "partner",
      category: "merchandising",
      durationHours: 9,
      storeId: storeA.id,
      title: "Выкладка товара",
      description: "Работа на торговом зале.\nНужна медкнижка.",
      pay: 3200,
      place: "Предприятие, центр",
      timeLabel: formatScheduleLabel(dateValue(0), "09:00", "18:00"),
      scheduledAt: combineDateAndTime(dateValue(0), "09:00")!,
      emoji: "🛒",
      lmkRequired: true,
      phone: storeA.phone,
    },
  });

  await prisma.task.create({
    data: {
      source: "partner",
      category: "cashier",
      durationHours: 8,
      storeId: storeA.id,
      title: "Кассир на вечер",
      description: "Работа на кассе, нужна медкнижка и аккуратность.",
      pay: 3500,
      place: "Предприятие, центр",
      timeLabel: formatScheduleLabel(dateValue(1), "14:00", "22:00"),
      scheduledAt: combineDateAndTime(dateValue(1), "14:00")!,
      emoji: "🧾",
      lmkRequired: true,
      phone: storeA.phone,
      status: "ACCEPTED",
      workerName: "Максим",
      workerPhone: "+79995556677",
      acceptedAt: dateAt(0),
    },
  });

  const doneTask = await prisma.task.create({
    data: {
      source: "person",
      category: "personal",
      durationHours: 2,
      title: "Перенести мебель в квартиру",
      description: "Диван и шкаф на 3 этаж, лифт есть.",
      pay: 4000,
      place: "202 мкр",
      timeLabel: formatScheduleLabel(dateValue(-3), "11:00", "13:00"),
      scheduledAt: combineDateAndTime(dateValue(-3), "11:00")!,
      emoji: "📦",
      lmkRequired: false,
      phone: "+79997654321",
      status: "DONE",
      workerName: "Максим",
      workerPhone: "+79995556677",
      acceptedAt: dateAt(-3),
      publisherCompletedAt: dateAt(-2),
      workerCompletedAt: dateAt(-2),
      completedAt: dateAt(-2),
    },
  });

  await prisma.review.create({
    data: {
      taskId: doneTask.id,
      reviewerPhone: "+79997654321",
      revieweePhone: "+79995556677",
      rating: 5,
      comment: "Всё аккуратно, приехал вовремя. Рекомендую!",
    },
  });

  await prisma.review.create({
    data: {
      taskId: doneTask.id,
      reviewerPhone: "+79995556677",
      revieweePhone: "+79997654321",
      rating: 5,
      comment: "Заказчик всё объяснил, оплата сразу после работы.",
    },
  });

  console.log("Seed OK. Demo profiles: +79995556677 (Максим, 5★). Open task:", openIce.id);
  console.log("Partner demo codes: YKT-DEMO-1, YKT-DEMO-2");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
