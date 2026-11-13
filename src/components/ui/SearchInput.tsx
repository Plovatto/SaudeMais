import { LuSearch } from 'react-icons/lu';
import { Input, type InputProps } from './Input';

export interface SearchInputProps extends Omit<InputProps, 'type' | 'icon' | 'label'> {
  label: string;
}

export function SearchInput({ label, labelHidden = true, ...props }: SearchInputProps) {
  return (
    <div role="search">
      <Input type="search" icon={<LuSearch />} label={label} labelHidden={labelHidden} {...props} />
    </div>
  );
}
