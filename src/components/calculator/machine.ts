import bigDecimal from 'js-big-decimal';
import { assign, createMachine } from 'xstate';

type ModeTypes = 'Ether' | 'Gwei' | 'Wei';

export interface calculatorMachineContext {
  isEditing: boolean;
  display: string;
  equation: string[]; // ['3','+','6','x','3']
  denomination: ModeTypes; // 'Gwei', 'Ether' | 'Wei'
}

const INITIAL_CALCULATOR_STATE = {
  display: '0',
  isEditing: false,
  equation: [],
  denomination: 'Gwei' as ModeTypes, // indicated by requirement as frequently quoted in
};

export const calculatorMachine = createMachine<calculatorMachineContext>(
  {
    id: 'calculator',
    context: { ...INITIAL_CALCULATOR_STATE },
    initial: 'idle',
    predictableActionArguments: true,
    states: {
      idle: {
        on: {
          CLEAR: {
            target: 'idle',
            actions: 'reset',
            internal: false,
          },
          CHANGE_DENOMINATION: {
            target: 'idle',
            actions: 'convert',
          },
          NUMBER: [
            {
              target: 'operand.zero',
              cond: 'isZero',
              actions: 'setNumber',
            },
            {
              target: 'operand.before_decimal_point',
              cond: 'isNotZero',
              actions: 'setNumber',
            },
          ],
          DECIMAL: {
            target: 'operand.after_decimal_point',
            actions: 'appendDecimalPointToDisplay',
          },
          ENTER_INPUT: {
            target: 'operand.entering_input',
            actions: 'editInput',
          },
        },
      },
      operand: {
        on: {
          CLEAR: {
            target: 'idle',
            actions: 'reset',
          },
          CHANGE_DENOMINATION: {
            target: 'operand',
            actions: 'convert',
          },
          EQUAL: [
            {
              target: 'error',
              cond: 'isDivideByZero',
              actions: 'setNaN',
            },
            {
              cond: 'isValidEquation',
              target: 'result',
              actions: ['appendOperandToEquation', 'saveResultAsOperand'],
            },
          ],
          OPERATOR: [
            {
              target: 'error',
              cond: 'isDivideByZero',
              actions: 'setNaN',
            },
            {
              target: 'operator',
              cond: 'isMultiplyDivideAfterPlusMinus',
              actions: [
                'appendOperandToEquation',
                'consolidateOperand',
                'appendOperatorToEquation',
              ],
            },
            {
              target: 'operator',
              cond: 'isValidEquation',
              actions: [
                'appendOperandToEquation',
                'saveResultAsOperand',
                'appendOperatorToEquation',
              ],
            },
            {
              target: 'operator',
              actions: ['appendOperandToEquation', 'appendOperatorToEquation'],
            },
          ],
        },
        initial: 'zero',
        states: {
          zero: {
            on: {
              NUMBER: {
                target: 'before_decimal_point',
                actions: 'setNumber',
              },
              ENTER_INPUT: {
                target: 'entering_input',
                actions: 'editInput',
              },
            },
          },
          before_decimal_point: {
            on: {
              NUMBER: {
                target: 'before_decimal_point',
                actions: 'appendNumberToDisplay',
                internal: false,
              },
              DECIMAL: {
                target: 'after_decimal_point',
                actions: 'appendDecimalPointToDisplay',
              },
              ENTER_INPUT: {
                target: 'entering_input',
                actions: 'editInput',
              },
            },
          },
          after_decimal_point: {
            on: {
              NUMBER: {
                target: 'after_decimal_point',
                actions: 'appendNumberToDisplay',
                internal: false,
              },
              ENTER_INPUT: {
                target: 'entering_input',
                actions: 'editInput',
              },
            },
          },
          entering_input: {
            on: {
              INPUT_NUMBER: [
                {
                  cond: 'isZero',
                  target: 'zero',
                  actions: ['setNumber', 'closeInput'],
                },
                {
                  cond: 'isDecimal',
                  target: 'after_decimal_point',
                  actions: ['setNumber', 'closeInput'],
                },
                {
                  cond: 'isNotDecimal',
                  target: 'before_decimal_point',
                  actions: ['setNumber', 'closeInput'],
                },
              ],
            },
          },
        },
      },
      operator: {
        on: {
          CLEAR: {
            target: 'idle',
            actions: 'reset',
          },
          CHANGE_DENOMINATION: {
            target: 'operator',
            actions: 'convert',
          },
          NUMBER: [
            {
              cond: 'isZero',
              target: 'operand.zero',
              actions: 'setNumber',
            },
            {
              cond: 'isNotZero',
              target: 'operand.before_decimal_point',
              actions: 'setNumber',
            },
          ],
          DECIMAL: {
            target: 'operand.after_decimal_point',
            actions: ['setNumberToZero', 'appendDecimalPointToDisplay'],
          },
          OPERATOR: [
            {
              cond: 'isValidEquationOnPlusMinus',
              target: 'operator',
              actions: [
                'removeOperator',
                'saveResultAsOperand',
                'appendOperatorToEquation',
              ],
            },
            {
              target: 'operator',
              actions: 'updateOperator',
            },
          ],
          EQUAL: [
            {
              target: 'error',
              cond: 'isDivideByZero',
              actions: 'setNaN',
            },
            {
              target: 'result',
              actions: ['removeOperator', 'saveResultAsOperand'],
            },
          ],
          ENTER_INPUT: {
            target: 'operand.entering_input',
            actions: ['setNumberToZero', 'editInput'],
          },
        },
      },
      result: {
        on: {
          CLEAR: {
            target: 'idle',
            actions: 'reset',
          },
          CHANGE_DENOMINATION: {
            target: 'result',
            actions: 'convert',
          },
          OPERATOR: [
            {
              target: 'operator',
              actions: 'appendOperatorToEquation',
            },
          ],
          NUMBER: [
            {
              cond: 'isZero',
              target: 'operand.zero',
              actions: ['reset', 'setNumber'],
            },
            {
              target: 'operand.before_decimal_point',
              actions: ['reset', 'setNumber'],
            },
          ],
          DECIMAL: {
            target: 'operand.after_decimal_point',
            actions: ['reset', 'appendDecimalPointToDisplay'],
          },
          ENTER_INPUT: {
            target: 'operand.entering_input',
            actions: ['reset', 'editInput'],
          },
        },
      },
      error: {
        on: {
          CLEAR: {
            target: 'idle',
            actions: 'reset',
          },
        },
      },
    },
  },
  {
    actions: {
      saveResultAsOperand: assign((context, event) => {
        const result = compute(context.equation);
        return {
          ...context,
          display: result,
          equation: [result],
        };
      }),
      consolidateOperand: assign((context, event) => {
        const result = compute(context.equation.slice(2));
        return {
          ...context,
          display: result,
          equation: [context.equation[0], context.equation[1], result],
        };
      }),
      updateOperator: assign((context, event) => {
        return {
          ...context,
          equation: [...context.equation.slice(0, -1), event.key],
        };
      }),
      removeOperator: assign((context, event) => {
        return {
          ...context,
          equation: [...context.equation.slice(0, -1)],
        };
      }),
      appendOperandToEquation: assign((context, event) => {
        return {
          ...context,
          equation: [...context.equation, context.display], // ['5']
        };
      }),
      appendOperatorToEquation: assign((context, event) => {
        return {
          ...context,
          equation: [...context.equation, event.key], // ['5', '+']
        };
      }),
      setNumber: assign((context, event) => {
        return {
          ...context,
          display: `${event.key}`,
        };
      }),
      setNumberToZero: assign((context, event) => {
        return {
          ...context,
          display: '0',
        };
      }),
      editInput: assign((context, event) => {
        return {
          ...context,
          isEditing: true,
        };
      }),
      closeInput: assign((context, event) => {
        return {
          ...context,
          isEditing: false,
        };
      }),
      // macOS calculator output when divide by zero
      setNaN: assign((context, event) => {
        return {
          ...INITIAL_CALCULATOR_STATE,
          display: 'Not a number',
        };
      }),
      appendDecimalPointToDisplay: assign((context, event) => {
        return {
          ...context,
          display: `${context.display}${event.key}`, // '5.'
        };
      }),
      appendNumberToDisplay: assign((context, event) => {
        return {
          ...context,
          display: `${context.display.slice()}${event.key}`, // '5.5'
        };
      }),
      reset: assign((context, event) => {
        return {
          ...INITIAL_CALCULATOR_STATE,
        };
      }),
      convert: assign((context, event) => {
        switch (context.denomination) {
          case 'Ether':
            return {
              ...context,
              equation: context.equation.map((element) => {
                return ['+', '-', 'x', '÷'].includes(element)
                  ? element
                  : convertEtherToGwei(element);
              }),
              display: convertEtherToGwei(context.display),
              denomination: 'Gwei',
            };
          case 'Gwei':
            return {
              ...context,
              equation: context.equation.map((element) => {
                return ['+', '-', 'x', '÷'].includes(element)
                  ? element
                  : convertGweiToWei(element);
              }),
              display: convertGweiToWei(context.display),
              denomination: 'Wei',
            };
          case 'Wei':
            return {
              ...context,
              equation: context.equation.map((element) => {
                return ['+', '-', 'x', '÷'].includes(element)
                  ? element
                  : convertWeiToEther(element);
              }),
              display: convertWeiToEther(context.display),
              denomination: 'Ether',
            };
          default:
            return {
              ...context,
            };
        }
      }),
    },
    guards: {
      isMultiplyDivideAfterPlusMinus: (context, event) =>
        ['x', '÷'].includes(event.key) &&
        (context.equation.includes('+') || context.equation.includes('-')),
      isValidEquation: (context, event) =>
        [...context.equation, context.display].length > 1 &&
        [...context.equation, context.display].length % 2 === 1,
      isValidEquationOnPlusMinus: (context, event) =>
        ['+', '-'].includes(event.key) &&
        [...context.equation, context.display].length > 1 &&
        [...context.equation, context.display].length % 2 === 1,
      isZero: (context, event) => event.key === '0',
      isNotZero: (context, event) => event.key !== '0',
      isDecimal: (context, event) => event.key.includes('.'),
      isNotDecimal: (context, event) => !event.key.includes('.'),
      isDivideByZero: (context, event) =>
        ['0', '0.', '-0.', '-0'].includes(context.display) &&
        context.equation.some(
          (element, index) => index % 2 === 1 && element === '÷'
        ),
    },
  }
);

/**
 * 1 Ether = 10^18 Wei
 * 1 Gwei = 10 ^ 9 Wei
 */

function convertEtherToGwei(Ether: string) {
  return bigDecimal.multiply(Ether, Math.pow(10, 9));
}

function convertGweiToWei(Ether: string) {
  return bigDecimal.multiply(Ether, Math.pow(10, 9));
}

function convertWeiToEther(Wei: string) {
  return bigDecimal.divide(Wei, Math.pow(10, 18), 24);
}

function compute(equation: string[]) {
  const stack: string[] = [];
  let num = '';
  let sign = null;
  // loop till the full length of the array to account for last sign
  for (let i = 0; i <= equation.length; i++) {
    const curr = equation[i];
    //handle space
    if (curr === ' ') continue;
    //if char is a number
    if (!isNaN(Number(curr))) num += curr;
    //if we have a  sign + - / *
    if (isNaN(Number(curr))) {
      const tempNum = new bigDecimal(num);
      switch (sign) {
        case '+':
        case null:
          // push the initial number into the stack
          stack.push(tempNum.getValue());
          break;
        case '-':
          // push any values after the subtraction sign as negative
          stack.push(tempNum.negate().getValue());
          break;
        case 'x':
          // pop the stack then multiply and push back
          stack.push(tempNum.multiply(new bigDecimal(stack.pop())).getValue());
          break;
        case '÷':
          // pop the stack then devide and push back
          stack.push(bigDecimal.divide(stack.pop(), tempNum.getValue(), 12));
          break;
      }
      // sign becomes current sign
      sign = curr;
      // we reset num
      num = '';
    }
  }
  // reduce the array adding positive and negative numbers
  return stack.reduce((a: string, b: string) => {
    return bigDecimal.add(a, b);
  }, '0');
}
