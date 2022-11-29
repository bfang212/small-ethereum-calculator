import { AutoTextSize } from 'auto-text-size';
import classnames from 'classnames';
import bigDecimal from 'js-big-decimal';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ReactComponent as ArrowRight } from '../../assets/arrow-right.svg';
import { calculatorMachineContext } from '../calculator/machine';
import styles from './Screen.module.scss';

interface IScreenProps {
  context: calculatorMachineContext;
  send: ({ type, key }: { type: string; key?: string | number }) => void;
}
const units = ['Ether', 'Gwei', 'Wei'];

const Screen = ({ context, send }: IScreenProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { display, denomination, isEditing } = context;
  const [inputNumber, setInputNumber] = useState('0');

  useEffect(() => {
    if (inputRef && inputRef.current && isEditing === true) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setInputNumber(display);
  }, [display]);

  return (
    <div className={styles.screen}>
      <div className={styles['screen__result']} onClick={sendMachineEnterInput}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            id="output"
            name="output"
            value={isEditing ? inputNumber : display}
            onKeyDown={handleKeyDown}
            onBlur={handleFocusOut}
            onChange={handleChange}
          />
        ) : (
          <AutoTextSize maxFontSizePx={32}>
            {formatDisplay(display)}
          </AutoTextSize>
        )}
      </div>
      <div className={styles[`screen__unit-display`]}>
        {units.map((unit) => (
          <div
            className={classnames(styles[`screen__unit-display__unit`], {
              [styles[`screen__unit-display__unit--selected`]]:
                denomination === unit,
            })}
            key={unit}
          >
            <ArrowRight />
            <span>{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      setInputNumber(!inputNumber || inputNumber === '-' ? '0' : inputNumber);

      send({
        type: 'INPUT_NUMBER',
        key: !inputNumber || inputNumber === '-' ? '0' : inputNumber,
      });
    }
  }

  function handleFocusOut() {
    setInputNumber(!inputNumber || inputNumber === '-' ? '0' : inputNumber);

    send({
      type: 'INPUT_NUMBER',
      key: !inputNumber || inputNumber === '-' ? '0' : inputNumber,
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { value } = e.currentTarget;

    // handles postive and negative numbers that end with decimal point
    if (/^-?(0|[1-9]\d*)?(\.\d*)?$/.test(value)) {
      // always begin with a digit
      if (value === '.') {
        return setInputNumber('0.');
      }
      if (value === '-.') {
        return setInputNumber('-0.');
      }
      setInputNumber(value);
    }
  }

  function formatDisplay(value: string) {
    if (isNaN(Number(value))) return 'Not a number';
    if (value.slice(-1) === '.') return value;
    return new bigDecimal(parseFloat(display).toString()).getPrettyValue(
      3,
      ','
    );
  }

  function sendMachineEnterInput() {
    send({ type: 'ENTER_INPUT' });
  }
};

export default Screen;
