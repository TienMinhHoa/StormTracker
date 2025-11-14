export const getColorClasses = (color: string) => {
  switch (color) {
    case 'red':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500',
        text: 'text-red-400',
        hover: 'hover:bg-red-500/20',
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500',
        text: 'text-yellow-400',
        hover: 'hover:bg-yellow-500/20',
      };
    case 'green':
      return {
        bg: 'bg-green-500/10',
        border: 'border-green-500',
        text: 'text-green-400',
        hover: 'hover:bg-green-500/20',
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        border: 'border-gray-500',
        text: 'text-gray-400',
        hover: 'hover:bg-gray-500/20',
      };
  }
};
