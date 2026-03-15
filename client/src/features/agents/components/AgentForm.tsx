import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
  emoji: z.string().optional(),
  model: z.string().optional(),
  instructions: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AgentForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (_data: FormValues) => {
    // TODO: save agent
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          id="name"
          className={`w-full border rounded px-3 py-2 ${errors.name ? 'border-red-500' : ''}`}
          {...register('name')}
        />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Role
        </label>
        <input
          id="role"
          className="w-full border rounded px-3 py-2"
          {...register('role')}
        />
      </div>

      <div>
        <label htmlFor="emoji" className="block text-sm font-medium mb-1">
          Emoji
        </label>
        <input
          id="emoji"
          className="w-full border rounded px-3 py-2"
          {...register('emoji')}
        />
      </div>

      <div>
        <label htmlFor="model" className="block text-sm font-medium mb-1">
          Model
        </label>
        <select
          id="model"
          className="w-full border rounded px-3 py-2"
          {...register('model')}
        >
          <option value="">Select model</option>
          <option value="gpt-4">GPT-4</option>
          <option value="claude-3">Claude 3</option>
        </select>
      </div>

      <div>
        <label htmlFor="instructions" className="block text-sm font-medium mb-1">
          Instructions
        </label>
        <textarea
          id="instructions"
          className="w-full border rounded px-3 py-2 min-h-[100px]"
          {...register('instructions')}
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save
      </button>
    </form>
  );
}
