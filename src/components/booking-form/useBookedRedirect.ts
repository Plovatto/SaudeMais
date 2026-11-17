import { useNavigate } from 'react-router';
import { useToast } from '@components/ui';
import { bookingUrl } from '@constants/areas';

export function useBookedRedirect<B extends { id: string }>(message: (booked: B) => string) {
  const navigate = useNavigate();
  const { show } = useToast();
  return (booked: B) => {
    show({ message: message(booked), tone: 'success' });
    void navigate(bookingUrl(booked.id));
  };
}
