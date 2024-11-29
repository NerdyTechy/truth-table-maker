#! /usr/bin/env node

import BooleanExpressions from 'boolean-expressions';
import * as process from 'process';

/**
 * Translates a word-based logic expression from words to fancy symbols
 * @param expression The word-based expression to translate
 * @returns The same expression, but with symbols instead of words
 */
function translateToLogicSymbols(expression: string): string {
    return expression
        .replace(/\band\b/g, '∧')
        .replace(/\bor\b/g, '∨')
        .replace(/\bnot\b/g, '¬')
        .replace(/\bnand\b/g, '⊼')
        .replace(/\bnor\b/g, '⊽')
        .replace(/\bxor\b/g, '⊕');
}

/**
 * Extracts any sub-expressions from the original expression to show each part in
 * its own column to make the truth tables easier to read and understand
 * 
 * Example: "a and b and c or d" would have columns for a, b, c, d, a and b, c or d,
 * and the full expression.
 * @param expression The logical expression to extract sub-expressions from
 * @returns A string array of sub-expressions
 */
function extractSubExpressions(expression: string): string[] {
    const subExpressions: Set<string> = new Set();
    // there is definitely a far better way of doing this that doesn't make you hate yourself
    // but that wouldn't be any fun so have a very long and confusing regex
    const regex = /\b(not\s+\w+|\w+\s+(and|or|nand|nor|xor)\s+not\s+\w+|\w+\s+(and|or|nand|nor|xor)\s+\w+)\b/g;
    let match;
    while ((match = regex.exec(expression)) !== null) {
        const subExpression = match[0];
        subExpressions.add(subExpression);
        // make sure negations are given their own column
        if (subExpression.startsWith('not ')) {
            subExpressions.add(subExpression.replace('not ', ''));
        } else {
            const negatedExpression = `not (${subExpression})`;
            if (expression.includes(negatedExpression)) {
                subExpressions.add(negatedExpression);
            }
        }
    }
    return Array.from(subExpressions);
}

/**
 * Adds whitespace padding to a string to display it in the center.
 * 
 * Used for results in the tables to put them in the center of the columns.
 * @param str The string to pad
 * @param width The width that the string needs to be
 * @returns The padded string with content in the center
 */
function padCenter(str: string, width: number): string {
    const padding = width - str.length;
    const paddingLeft = Math.floor(padding / 2);
    const paddingRight = padding - paddingLeft;
    return ' '.repeat(paddingLeft) + str + ' '.repeat(paddingRight);
}

/**
 * Generates a truth table from a word-based logical expression
 * @param expression The word-based logical expression to generate a truth table for
 */
function generateTruthTable(expression: string) {
    const translatedExpression = translateToLogicSymbols(expression); // translate words->symbols
    const b = new BooleanExpressions(expression);
    const variables = b.getVariableNames(); // extract variables from the expression
    const subExpressions = extractSubExpressions(expression);
    console.log("subexpressions", subExpressions);
    const allExpressions = Array.from(new Set([...subExpressions, expression]));
    const filteredExpressions = allExpressions.filter(exp => !variables.includes(exp)); // filter out duplicate variables
    const numRows = 2 ** variables.length; // work out how many rows the table will have
    const truthTable: boolean[][] = []; // initialise the table as a 2d array

    for (let i = 0; i < numRows; i++) { // loop over the rows to insert them into the table
        const row: boolean[] = [];
        for (let j = 0; j < variables.length; j++) {
            row.push(Boolean(i & (1 << (variables.length - j - 1))));
        }
        truthTable.push(row);
    }

    const headers = variables.concat(filteredExpressions.map(exp => translateToLogicSymbols(exp))); // get header titles and translate words->symbols
    const colWidths = headers.map(header => header.length); // get widths of each col for both the border and to pad the values into the center of the cols
    const border = '+' + headers.map((_, i) => '-'.repeat(colWidths[i] + 2)).join('+') + '+'; // add a nice sexy border to the outside of the table

    // print the expression and header row
    console.log(`Expression: ${translatedExpression}`);
    console.log(border);
    console.log('|' + headers.map((header, i) => ' ' + padCenter(header, colWidths[i]) + ' ').join('|') + '|');
    console.log(border);

    // loop over each of the value rows, parse and evaluate the expressions, then print it all nicely
    truthTable.forEach(row => {
        const trueVariables = variables.filter((_, i) => row[i]);
        const results = filteredExpressions.map(expr => {
            const exprEvaluator = new BooleanExpressions(expr);
            return exprEvaluator.evaluate(trueVariables);
        });
        const rowValues = row.map(v => (v ? 'T' : 'F')).concat(results.map(r => (r ? 'T' : 'F')));
        console.log('|' + rowValues.map((value, i) => ' ' + padCenter(value, colWidths[i]) + ' ').join('|') + '|');
    });
    console.log(border);
}

// grab the input expression and give it to the main function
const expression = process.argv[2];
if (!expression) {
    console.error('Please provide a logical expression as an argument.');
    process.exit(1);
}

generateTruthTable(expression);