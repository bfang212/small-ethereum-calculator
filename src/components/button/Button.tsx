import classnames from 'classnames';
import styles from './Button.module.scss';

interface IButtonProps {
  value: string | OperationTypes;
  handleClick: (value: string) => () => void;
}

type OperationTypes = '=' | 'x' | '-' | '-' | '÷';

const getClassName = (value: string | OperationTypes) => {
  const buttonStyles = {
    '=': 'equal',
    x: 'operator',
    '-': 'operator',
    '+': 'operator',
    '÷': 'operator',
    mode: 'mode',
    'C': 'clear',
  };
  return buttonStyles[value as keyof typeof buttonStyles];
};

const Button = ({ value, handleClick }: IButtonProps) => {
  return (
    <button
      className={classnames(
        styles.button,
        styles[`button__${getClassName(value)}`]
      )}
      onClick={handleClick(value)}
    >
      {value}
    </button>
  );
};

export default Button;
