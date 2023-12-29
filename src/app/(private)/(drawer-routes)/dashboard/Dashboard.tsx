'use client';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { redirect, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Calender from '@/assets//Dashboard/calender.svg';
import DoughnutChart from '@/components/DoughnutChart/DoughnutChart';
import Fire from '@/assets/Dashboard/fire.svg';
import Minus from '@/assets/Dashboard/minus.svg';
import Tick from '@/assets/Dashboard/tick.svg';
import Cross from '@/assets/Dashboard/cross.svg';
import Barbell from '@/assets/Dashboard/barbell.svg';
import Plate from '@/assets/Dashboard/plate.svg';
import Link from 'next/link';
import { Warrior } from '@/src/types/app/(private)/(drawer-routes)/dashboard';
import {
  FoodItem,
  Meal,
  MealsByType,
} from '@/src/types/page/waza_warrior/food_log';
import { fetchNutrients, fetchSavedMeals } from '../services/meals_services';
import { NutritionixNutrientsEndpoint } from '@/src/types/app/(private)/(drawer-routes)/diet';

export function Dashboard() {
  const [warrior, setWarrior] = useState<Warrior | null>(null);
  const [macros, setMacros] = useState({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const router = useRouter();
  const session = useSession();

  if (session.data && session.data.user.isNewUser) {
    redirect('/completeProfile');
  }
  useEffect(() => {
    (async () => {
      let apiRouteType: string = '';
      let pageRouteType: string;
      if (!session.data) return;
      else if (session.data.user.user_type === 'Waza Trainer') {
        apiRouteType = 'waza_trainer';
        pageRouteType = 'wazaTrainer';
      } else if (session.data.user.user_type === 'Waza Warrior') {
        apiRouteType = 'waza_warrior';
        pageRouteType = 'wazaWarrior';
      } else return;
      const res = await fetch(
        `http://localhost:3000/api/${apiRouteType}/?user_id=${session.data.user.user_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (!res.ok) {
        const data = await res.json();
        console.log('User not found:', data);
        router.push(
          `/completeProfile/${pageRouteType}/${session.data.user.user_id}`,
        );
      }
    })();
  }, [session, router]);

  useEffect(() => {
    if (!session.data) return; // remove this and use non-null operator

    if (session.data.user.isNewUser) {
      router.push('/complete-user');
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/waza_warrior/?user_id=${session.data.user.user_id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );
        const fetchedData: Warrior = await res.json();
        setWarrior(fetchedData);
        console.log(fetchedData);
      } catch (error) {
        console.error('Error fetching warrior data:', error);
      }
    };

    fetchData();
  }, [session, router]);

  useEffect(() => {
    const fetchMacros = async () => {
      try {
        if (!warrior) return;
        const fetchedData: MealsByType = await fetchSavedMeals(
          warrior.warrior_id!,
          new Date(date),
        );
        const allFoodItems = [];
        for (const meal of Object.values(fetchedData)) {
          allFoodItems.push(
            ...meal.meal_food_items.map((item: FoodItem) => {
              return `${item.quantity} ${item.unit} ${item.food_item_identifier}`;
            }),
          );
        }

        const query: string = allFoodItems.join(';');

        if (!query.length) return;
        const nutrients: NutritionixNutrientsEndpoint =
          await fetchNutrients(query);

        const totals = nutrients.foods.reduce(
          (
            acc: {
              calories: number;
              protein: number;
              carbs: number;
              fats: number;
            },
            food: {
              nf_calories: number;
              nf_protein: number;
              nf_total_carbohydrate: number;
              nf_total_fat: number;
            },
          ) => {
            acc.calories += food.nf_calories;
            acc.protein += food.nf_protein * 4;
            acc.carbs += food.nf_total_carbohydrate * 4;
            acc.fats += food.nf_total_fat * 9;
            return acc;
          },
          { protein: 0, carbs: 0, fats: 0, calories: 0 },
        );

        setMacros(totals);
      } catch (error) {
        console.error('Error fetching macro data:', error);
      }
    };

    fetchMacros();
  }, [warrior, date]);
  const chartData = useMemo(
    () => ({
      labels: ['Protein', 'Carbs', 'Fats'],
      datasets: [
        {
          data: [macros.protein, macros.carbs, macros.fats],
          backgroundColor: ['#22c55e', '#6b7280', '#ef4444'],
          borderWidth: 1,
        },
      ],
    }),
    [macros],
  );
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
  };

  return (
    <div className='p-4'>
      <header className='mb-4 flex flex-row justify-between flex-wrap'>
        <p className='text-xl font-semibold text-gray-400'>Dashboard</p>
        <label className='border-2 rounded-3xl py-1 px-10 border-black/10 flex flex-row gap-2 items-center cursor-pointer'>
          <Image src={Calender} width={24} height={24} alt='calendar' />
          <input
            type='date'
            name='date'
            value={date}
            onChange={handleDateChange}
            className='text-sm font-medium bg-transparent focus:outline-none'
          />
        </label>
      </header>

      <main>
        <h2 className='text-lg font-semibold mb-4'>Welcome Back Waleed!</h2>
        <div className='flex flex-row gap-3 justify-between flex-wrap'>
          <div className='bg-white  p-4 rounded-lg shadow flex justify-center items-center flex-wrap flex-1 '>
            <div className='w-64 relative'>
              <DoughnutChart data={chartData} />
              <div className='absolute top-1/2 left-2/4 -translate-x-1/2 -translate-y-1/4 flex flex-col items-center '>
                <p className='font-bold text-3xl'>
                  {macros.calories.toFixed(0)}{' '}
                </p>
                <p className='bg-yellow-400 py-1 px-5 rounded-3xl  text-md'>
                  <span className='font-bold'>
                    / {warrior?.caloric_goal ?? 1500}
                  </span>{' '}
                  kcal
                </p>
              </div>
            </div>

            <div className='flex flex-col gap-2 justify-between min-w-fit mt-5'>
              <div className='flex flex-row bg-black rounded-3xl p-2 gap-1'>
                <Image src={Fire} width={20} height={20} alt='fire' />
                <p className='text-sm font-semibold text-yellow-500'>
                  Calories Burned
                </p>
                <p className='text-white text-sm font-semibold '>{`${0}kcal`}</p>
              </div>
              <div className='flex flex-row gap-1'>
                <div className='flex flex-row bg-green-500 rounded-3xl p-2 gap-1'>
                  <Image src={Minus} width={20} height={20} alt='minus' />
                  <p className='text-sm font-semibold text-white'>Protien</p>
                </div>
                <p className='text-black text-sm font-semibold flex items-center'>
                  {`${macros.protein.toFixed(2)}kcal`}
                </p>
              </div>
              <div className='flex flex-row gap-1'>
                <div className='flex flex-row bg-gray-500 rounded-3xl p-2 gap-1'>
                  <Image src={Tick} width={20} height={20} alt='tick' />
                  <p className='text-sm font-semibold text-white'>Carbs</p>
                </div>
                <p className='text-black text-sm font-semibold flex items-center'>
                  {`${macros.carbs.toFixed(2)}kcal`}
                </p>
              </div>
              <div className='flex flex-row gap-1'>
                <div className='flex flex-row bg-red-500 rounded-3xl p-2 gap-1'>
                  <Image src={Cross} width={20} height={20} alt='cross' />
                  <p className='text-sm font-semibold text-white'>Fats</p>
                </div>
                <p className='text-black text-sm font-semibold flex items-center'>
                  {`${macros.fats.toFixed(2)}kcal`}
                </p>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-2 justify-between flex-1 min-w-fit'>
            <div className='bg-black  p-10 rounded-lg gap-2 shadow flex justify-center items-center flex-1'>
              <Image src={Barbell} width={50} height={50} alt='calender' />
              <p className='text-xl text-white font-semibold'>Log Workout</p>
            </div>
            <Link
              href={'diet'}
              className='bg-white  p-10 rounded-lg gap-2 shadow flex justify-center items-center flex-1'
            >
              <Image src={Plate} width={50} height={50} alt='calender' />
              <p className='text-xl  font-semibold'>Log Diet</p>
            </Link>
          </div>
          <div className='w-full flex flex-row justify-between mt-4 gap-4 flex-wrap'>
            <div
              aria-label='Workout of the day'
              className='bg-white px-10 py-20 rounded-lg gap-2 shadow flex justify-center items-center min-w-fit flex-1'
            >
              <p className='text-xl  font-semibold'>Placeholder</p>
            </div>
            <div
              aria-label='Market place'
              className='bg-white  rounded-lg gap-2 px-10 py-20 shadow flex justify-center items-center min-w-fit flex-1 cursor-pointer'
            >
              <p className='text-xl  font-semibold'>Trainer Marketplace</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
