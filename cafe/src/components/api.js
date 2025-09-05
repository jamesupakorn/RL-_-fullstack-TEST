// ฟังก์ชันสำหรับเรียก API เมนู
import { URL } from './config'; // นำเข้า URL จากไฟล์ config

export async function getMenus() {
  const response = await fetch(URL + 'api/menu');
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json(); // รีเทิร์นเฉพาะข้อมูลเมนู
}


// ฟังก์ชันสำหรับเรียกข้อมูล ingredient ของเมนู
export async function getMenuIngredients(menu_id) {
  const response = await fetch(`${URL}api/menu_ingredient?menu_id=${menu_id}&ingredient_type=T01`);
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json(); // รีเทิร์นข้อมูลวัตถุดิบของเมนู
}
