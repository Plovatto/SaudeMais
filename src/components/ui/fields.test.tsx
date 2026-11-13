import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './Checkbox';
import { Input } from './Input';
import { PasswordInput } from './PasswordInput';
import { Select } from './Select';
import { Textarea } from './Textarea';

describe('Input', () => {
  it('is labelled and exposes its hint', () => {
    render(<Input label="E-mail" hint="Usamos para o login" />);

    const input = screen.getByLabelText('E-mail');
    expect(input).toHaveAccessibleDescription('Usamos para o login');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks the field invalid and reads the error before the hint', () => {
    render(<Input label="E-mail" hint="Usamos para o login" error="Informe um e-mail válido" />);

    const input = screen.getByLabelText('E-mail');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Informe um e-mail válido Usamos para o login');
  });

  it('adds its own description to the error and the hint instead of replacing them', () => {
    render(
      <>
        <p id="extra">Formato DDD + número</p>
        <Input label="Telefone" error="Telefone inválido" aria-describedby="extra" />
      </>,
    );

    expect(screen.getByLabelText('Telefone')).toHaveAccessibleDescription(
      'Telefone inválido Formato DDD + número',
    );
  });

  it('keeps the accessible name when the label is visually hidden', () => {
    render(<Input label="Buscar" labelHidden />);

    expect(screen.getByRole('textbox', { name: 'Buscar' })).toBeInTheDocument();
  });
});

describe('PasswordInput', () => {
  it('shows and hides the password with a labelled toggle', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Senha" />);
    const input = screen.getByLabelText('Senha');

    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('carries the error to the input', () => {
    render(<PasswordInput label="Senha" error="Mínimo de 8 caracteres" />);

    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription('Mínimo de 8 caracteres');
  });
});

describe('Select', () => {
  it('starts on the placeholder, which cannot be chosen again', () => {
    render(
      <Select label="Especialidade" placeholder="Escolha">
        <option value="1">Cardiologia</option>
      </Select>,
    );

    const select = screen.getByRole('combobox', { name: 'Especialidade' });
    expect(select).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Escolha' })).toBeDisabled();
  });

  it('marks the field invalid with its error', () => {
    render(
      <Select label="Especialidade" error="Escolha uma especialidade">
        <option value="1">Cardiologia</option>
      </Select>,
    );

    const select = screen.getByRole('combobox', { name: 'Especialidade' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Escolha uma especialidade');
  });
});

describe('Textarea and Checkbox', () => {
  it('describe their errors', () => {
    render(
      <>
        <Textarea label="Motivo" error="Informe o motivo" />
        <Checkbox label="Aceito os termos" error="É preciso aceitar os termos" />
      </>,
    );

    expect(screen.getByLabelText('Motivo')).toHaveAccessibleDescription('Informe o motivo');
    const checkbox = screen.getByRole('checkbox', { name: 'Aceito os termos' });
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAccessibleDescription('É preciso aceitar os termos');
  });

  it('adds its own description to the checkbox error', () => {
    render(
      <>
        <p id="terms">Leia os termos de uso</p>
        <Checkbox label="Aceito" error="Obrigatório" aria-describedby="terms" />
      </>,
    );

    expect(screen.getByRole('checkbox', { name: 'Aceito' })).toHaveAccessibleDescription(
      'Obrigatório Leia os termos de uso',
    );
  });

  it('toggles the checkbox by its label', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Lembrar de mim" />);

    await user.click(screen.getByText('Lembrar de mim'));

    expect(screen.getByRole('checkbox', { name: 'Lembrar de mim' })).toBeChecked();
  });
});
