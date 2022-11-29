import Button from '../button/Button';
import styles from './Controller.module.scss';

interface IControllerProps {
  send: ({ type, key }: { type: string; key?: string | number }) => void;
}
const buttonValues = [
  ['C', 'mode', '÷'],
  ['7', '8', '9', 'x'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

const Controller = ({ send }: IControllerProps) => {
  const handleClick = (value: string) => () => {
    if (value === 'C') {
      send({ type: 'CLEAR' });
    } else if (value === '.') {
      send({ type: 'DECIMAL', key: '.' });
    } else if (['+', '-', 'x', '÷'].includes(value)) {
      send({ type: 'OPERATOR', key: value });
    } else if (value === '=') {
      send({ type: 'EQUAL' });
    } else if (value === 'mode') {
      send({ type: 'CHANGE_DENOMINATION' });
    } else {
      send({ type: 'NUMBER', key: value });
    }
  };

  return (
    <div className={styles.controller}>
      {buttonValues.flat().map((value) => (
        <Button value={value} key={value} handleClick={handleClick} />
      ))}
    </div>
  );
};

export default Controller;
