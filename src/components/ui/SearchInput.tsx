import { LuSearch } from 'react-icons/lu';
import { Input, type InputProps } from './Input';

export type SearchInputProps = Omit<InputProps, 'type' | 'icon'>;

export function SearchInput({ label, labelHidden = true, ...props }: SearchInputProps) {
  return (
    <div role="search">
      <Input type="search" icon={<LuSearch />} label={label} labelHidden={labelHidden} {...props} />
    </div>
  );
}
