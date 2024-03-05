import { DialogClose } from '@radix-ui/react-dialog';
import { useState } from 'react';

export const CreateWorkout = ({
  session_id,
  onExerciseCreated,
}: {
  session_id: string;
  onExerciseCreated: Function;
}) => {
  // State to manage input values
  const [formData, setFormData] = useState({
    title: '',
    muscle_group: '',
    weight: 0,
    sets: 0,
    reps: 0,
    session_id: session_id,
  });

  // Handle input change
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const response = await fetch(
        'http://localhost:3000/api/waza_warrior/exercise',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            weight: Number(formData.weight),
            sets: Number(formData.sets),
            reps: Number(formData.reps),
            session_id: session_id,
          }),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to create exercise');
      }
      const newExercise = await response.json();
      console.log('================newExercise============');
      console.log(newExercise);
      onExerciseCreated(newExercise);
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='bg-white rounded-md p-4 flex flex-col gap-4 '
    >
      <div className='flex flex-col gap-2'>
        <input
          name='title'
          value={formData.title}
          onChange={handleChange}
          className=' py-1 px-4 focus:outline-none border-2 border-black/[.15] rounded-md text-center'
          placeholder='Workout Name'
        />
        <input
          name='muscle_group'
          value={formData.muscle_group}
          onChange={handleChange}
          className=' py-1 px-4 focus:outline-none border-2 border-black/[.15] rounded-3xl text-center'
          placeholder='Category'
        />
      </div>

      <div className='flex flex-col  gap-2'>
        {/* Weights, Sets, Reps inputs */}
        <input
          name='weight'
          type='number'
          value={formData.weight}
          onChange={handleChange}
          className=' py-1 px-4 focus:outline-none border-2 border-black/[.15] rounded-md text-center'
          placeholder='Weight'
        />
        <input
          name='sets'
          type='number'
          value={formData.sets}
          onChange={handleChange}
          className=' py-1 px-4 focus:outline-none border-2 border-black/[.15] rounded-md text-center'
          placeholder='Sets'
        />
        <input
          name='reps'
          type='number'
          value={formData.reps}
          onChange={handleChange}
          className=' py-1 px-4 focus:outline-none border-2 border-black/[.15] rounded-md text-center'
          placeholder='Reps'
        />
      </div>
      <DialogClose
        type='submit'
        className='border-2 rounded-3xl py-1 px-10 border-black/10 flex flex-row gap-2 items-center justify-center cursor-pointer'
      >
        Add Exercise
      </DialogClose>
    </form>
  );
};
