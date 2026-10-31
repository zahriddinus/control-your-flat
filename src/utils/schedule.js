import { supabase } from "../lib/supabese";
import { formatDate } from "./date";

// Har bir vazifa uchun: sarlavha va user o'sha kuni shu vazifadami
export const TASKS = [
  {
    key: "duty",
    icon: "⭐",
    title: "Navbatchilik kunlari",
    label: "Navbatchi",
    isAssigned: (schedule, userId) => schedule?.duty?.user_id === userId,
  },
  {
    key: "rubbish",
    icon: "🗑️",
    title: "Musor tashlash",
    label: "Musor tashlaydi",
    isAssigned: (schedule, userId) => schedule?.rubbish?.user_id === userId,
  },
  {
    key: "cleaning",
    icon: "🧹",
    title: "Generalniy uborka",
    label: "Generalniy uborka",
    isAssigned: (schedule, userId) =>
      schedule?.cleaning?.some((cleaningUser) => cleaningUser.user_id === userId) ?? false,
  },
];

export const getAssignedUsers = (users, task, schedule) =>
  users.filter((user) => task.isAssigned(schedule, user.user_id));

// "Eldor, Odilbek". Bazadagi ismlar oxirida bo'sh joy bo'lishi mumkin, shuning uchun trim
export const getAssignedNames = (users, task, schedule) =>
  getAssignedUsers(users, task, schedule)
    .map((user) => user.name.trim())
    .join(", ");

// Berilgan sanalar uchun get_duty_schedule'ni parallel chaqiradi.
// Natija sanalar bilan bir xil tartibda qaytadi
export const fetchSchedules = (dates) =>
  Promise.all(
    dates.map(async (date) => {
      const dateString = formatDate(date);

      const { data, error } = await supabase.rpc("get_duty_schedule", {
        target_date: dateString,
      });

      if (error) {
        throw new Error(`Schedule error ${dateString}: ${error.message}`);
      }

      return data;
    })
  );
