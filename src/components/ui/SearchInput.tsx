import { LuSearch } from 'react-icons/lu';
import { Input, type InputProps } from './Input';

export type SearchInputProps = Omit<InputProps, 'type' | 'icon'>;

export function SearchInput({ label, labelHidden = true, className, ...props }: SearchInputProps) {
  return (
    <div role="search" className={className}>
      <Input type="search" icon={<LuSearch />} label={label} labelHidden={labelHidden} {...props} />
    </div>
  );
}
