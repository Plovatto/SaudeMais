import type { UseFormRegisterReturn } from 'react-hook-form';
import { FormAlert, Input, Select, Skeleton } from '@components/ui';
import { UFS } from '@constants/ufs';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import type { DoctorCatalog } from './useDoctorCatalog';
import type { DoctorProfileValues } from './user-schemas';

type DoctorField = keyof DoctorProfileValues;

export interface DoctorProfileFieldsProps {
  catalog: DoctorCatalog;
  fields: Record<DoctorField, UseFormRegisterReturn>;
  errors: Partial<Record<DoctorField, string | undefined>>;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function DoctorProfileFields({
  catalog,
  fields,
  errors,
  disabled = false,
  autoFocus = false,
}: DoctorProfileFieldsProps) {
  if (catalog.loading && !catalog.error)
    return (
      <div aria-busy="true">
        <Skeleton className="h-72" />
      </div>
    );
  const locked = disabled || catalog.error !== null;
  return (
    <>
      <Select
        label="Especialidade"
        placeholder="Escolha a especialidade"
        disabled={locked}
        autoFocus={autoFocus}
        error={errors.specialtyId}
        {...fields.specialtyId}
      >
        {catalog.specialties.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </Select>
      <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
        <Input
          label={catalog.council ? `Número do ${catalog.council}` : 'Número do registro profissional'}
          inputMode="numeric"
          autoComplete="off"
          hint={catalog.council ? undefined : 'O conselho depende da especialidade escolhida.'}
          disabled={locked}
          error={errors.registryNumber}
          {...fields.registryNumber}
        />
        <Select
          label="UF"
          placeholder="UF"
          disabled={locked}
          error={errors.registryUf}
          {...fields.registryUf}
        >
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </Select>
      </div>
      <Select
        label="Unidade"
        placeholder="Escolha a unidade"
        disabled={locked}
        error={errors.unitId}
        {...fields.unitId}
      >
        {catalog.units.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </Select>
      {catalog.error && <FormAlert>{errorMessage(catalog.error)}</FormAlert>}
    </>
  );
}
