import { useMachine } from '@xstate/react';
import Controller from '../controller/Controller';
import Screen from '../screen/Screen';
import styles from './Calculator.module.scss';
import { calculatorMachine } from './machine';

const Calculator = () => {
  const [state, send] = useMachine(calculatorMachine);
  const { context } = state;

  return (
    <div className={styles.calculator}>
      <Screen context={context} send={send} />
      <Controller send={send} />
    </div>
  );
};

export default Calculator;
