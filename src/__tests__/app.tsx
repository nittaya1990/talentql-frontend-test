import '@testing-library/jest-dom/extend-expect';
import {
	cleanup,
	fireEvent,
	render as rtlRender,
} from '@testing-library/react';
import 'jest-styled-components';
import * as React from 'react';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { render } from '../../test/test-util';
import App from '../App';
import { authContext } from '../context/authContext';
import { colors, shapes } from '../filter.json';
import { useProvideAuth } from '../hooks/useProviderAuth';
import store from '../store';

const mockUseLocationValue = {
	pathname: '/',
	search: '',
	hash: '',
	state: null,
};

jest.mock('react-router-dom', () => ({
	...(jest.requireActual('react-router-dom') as {}),
	useLocation: jest.fn().mockImplementation(() => {
		return mockUseLocationValue;
	}),
}));

function HomeApp() {
	const auth = useProvideAuth();

	return (
		<>
			<ToastContainer
				position="top-right"
				autoClose={500}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
			/>
			<authContext.Provider value={auth}>
				<Provider store={store}>
					<App />
				</Provider>
			</authContext.Provider>
		</>
	);
}

describe('<App />', () => {
	beforeAll(() => {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: jest.fn().mockImplementation((query) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: jest.fn(), // Deprecated
				removeListener: jest.fn(), // Deprecated
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
				dispatchEvent: jest.fn(),
			})),
		});
	});
	// FIX: there are a lot of repitition in this test. Move the repeated lines in to a function
	afterEach(cleanup);

	test('should login with hardcode authentication details', async () => {
		const { getByTestId, findByText } = render(<App />);

		const input = getByTestId(/login/i);
		fireEvent.click(input);
		let welcome = await findByText(/welcome/i, { selector: 'p' });
		expect(welcome.textContent).toMatchInlineSnapshot(`"Welcome! Sign out"`);
	});

	test('All shapes should be selected initially', async () => {
		const { getByTestId, findByText, getAllByTestId } = rtlRender(<HomeApp />);
		const input = getByTestId(/login/i);
		fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });
		// debug(container);
		const shapesCheckBox = getAllByTestId(/shape-checkbox/i);
		// debug(shapesCheckBox);
		expect(shapesCheckBox.length).toEqual(shapes.length);
		shapesCheckBox.forEach((each) => {
			expect(each.hasAttribute('checked')).toBeTruthy();
		});
	});

	test('All colors should be selected initially', async () => {
		const { getByTestId, findByText, getAllByTestId } = rtlRender(<HomeApp />);
		const input = getByTestId(/login/i);
		fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });
		const colorCheckBox = getAllByTestId(/color-checkbox/i);
		expect(colorCheckBox.length).toEqual(colors.length);
		colorCheckBox.forEach((each) => {
			expect(each.hasAttribute('checked')).toBeTruthy();
		});
	});

	test('Multiple filters can be selected (differentiate the states - ) - shapes', async () => {
		const { getByTestId, findByText, findByTestId } = rtlRender(<HomeApp />);
		const input = getByTestId(/login/i);
		fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);
		expect((await message).textContent).toEqual('All Items');
		const ovalShape = await findByText(/Oval/i);
		fireEvent.click(ovalShape);
		expect((await message).textContent).toBe('Multiple Items');
	});

	test('Multiple filters can be selected (differentiate the states - ) - colors', async () => {
		const { getByTestId, findByText, findByTestId } = render(<App />);
		const input = getByTestId(/login/i);

		fireEvent.click(input);

		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);

		expect((await message).textContent).toEqual('All Items');

		const red = colors.find((color) => color.name === 'red');
		const matcher = new RegExp(red!.color, 'i');
		const redColor = await findByTestId(matcher);

		await fireEvent.click(
			(await redColor!.querySelector('input')) as HTMLInputElement,
		);

		expect((await message).textContent).toBe('Multiple Items');
		// @ts-ignore
		// console.log(store.getState().color);
	});

	test('Deselecting the last filter should select all filter - color', async () => {
		const {
			getByTestId,
			findByText,
			findByTestId,
			getAllByTestId,
			findAllByTestId,
		} = render(<App />);
		const input = getByTestId(/login/i);
		fireEvent.click(input);

		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);

		expect((await message).textContent).toEqual('All Items');

		// single color
		let colorCheckBox = getAllByTestId(/color-checkbox/i);
		expect(colorCheckBox.length).toEqual(colors.length);
		// check everything but the last one
		colorCheckBox.slice(1).forEach(async (each) => {
			await fireEvent.click(each as HTMLElement);
		});

		fireEvent.click(colorCheckBox[0]);

		colorCheckBox = await findAllByTestId(/color-checkbox/i);

		let allSelectedAgain = colorCheckBox.every((each) => {
			let parent = each.parentElement as HTMLElement;
			return parent?.classList.contains('current');
		});

		expect(allSelectedAgain).toEqual(true);
	});

	test('Deselecting the last filter should select all filter - shape', async () => {
		const {
			getByTestId,
			findByText,
			findByTestId,
			getAllByTestId,
			findAllByTestId,
		} = render(<App />);
		const input = getByTestId(/login/i);
		fireEvent.click(input);

		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);

		expect((await message).textContent).toEqual('All Items');

		// single color
		let shapeCheckBox = getAllByTestId(/shape-checkbox/i);
		expect(shapeCheckBox.length).toEqual(shapes.length);
		// check everything but the last one
		shapeCheckBox.slice(1).forEach(async (each) => {
			await fireEvent.click(each as HTMLInputElement);
		});

		const parent = shapeCheckBox[0] as HTMLElement;
		fireEvent.click(parent);

		shapeCheckBox = await findAllByTestId(/shape-checkbox/i);

		let allSelectedAgain = shapeCheckBox.every((each) => {
			let parent = each.parentElement as HTMLElement;
			return parent?.classList.contains('current');
		});

		expect(allSelectedAgain).toBeTruthy();
	});

	// gird title
	test('When all the colors and shapes are selected: “All items: ”', async () => {
		const { getByTestId, findByText, findByTestId } = render(<App />);
		const input = getByTestId(/login/i);
		fireEvent.click(input);

		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);

		expect((await message).textContent).toEqual('All Items');
	});

	test('When all the colors and multiple shapes or all the shapes and multiple colors are selected: “Multiple items: ”', async () => {
		const { getByTestId, findByText, findByTestId } = render(<App />);
		const input = getByTestId(/login/i);
		fireEvent.click(input);

		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);

		expect((await message).textContent).toEqual('All Items');

		const red = colors.find((color) => color.name === 'red');
		const matcher = new RegExp(red!.color, 'i');
		const redColor = await findByTestId(matcher);

		await fireEvent.click(
			(await redColor!.querySelector('input')) as HTMLInputElement,
		);
		expect((await message).textContent).toBe('Multiple Items');
	});

	// TODO: can still be improved - make sure that the test is real, similar to the way the app will be used by know and not assuming the filter that is left un checked and making the message more interoperable of data changes
	// NB if that changes test may break
	test('When all the shapes and a single color is selected: “All red items: ”', async () => {
		const { getByTestId, findByText, findByTestId, getAllByTestId } = render(
			<App />,
		);
		const input = getByTestId(/login/i);
		fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);

		expect((await message).textContent).toEqual('All Items');

		const colorCheckBox = getAllByTestId(/color-checkbox/i);

		expect(colorCheckBox.length).toEqual(colors.length);

		// remove the first checkBox assumed to be red color
		colorCheckBox.slice(1).forEach(async (each) => {
			await fireEvent.click(each as HTMLInputElement);
		});

		expect((await message).textContent).toBe('All red Items');
	});

	// TODO: can still be improved - make sure that the test is real, similar to the way the app will be used by know and not assuming the filter that is left un checked and making the message more interoperateable of data changes
	// NB if that changes test may break
	test('When all the colors and single shape is selected: “All oval items: ', async () => {
		const { getByTestId, findByText, findByTestId, getAllByTestId } = render(
			<App />,
		);
		const input = getByTestId(/login/i);
		fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);

		expect((await message).textContent).toEqual('All Items');

		const shapeCheckbox = getAllByTestId(/shape-checkbox/i);

		expect(shapeCheckbox.length).toEqual(shapes.length);

		// remove the first checkBox assumed to be oval shape
		shapeCheckbox.slice(1).forEach(async (each) => {
			await fireEvent.click(each as HTMLInputElement);
		});

		expect((await message).textContent).toBe('All Oval Items');
	});

	test('When multiple shapes and a single color is selected: “Multiple red items "', async () => {
		const { getByTestId, findByText, findByTestId, getAllByTestId } = render(
			<App />,
		);
		const input = getByTestId(/login/i);
		await fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);

		expect((await message).textContent).toEqual('All Items');
		// single color
		const colorCheckBox = getAllByTestId(/color-checkbox/i);

		expect(colorCheckBox.length).toEqual(colors.length);
		// remove the first checkBox assumed to be red color
		colorCheckBox.slice(1).forEach(async (each) => {
			await fireEvent.click(each as HTMLInputElement);
		});

		// multiple shapes
		const shapeCheckbox = getAllByTestId(/shape-checkbox/i);

		expect(shapeCheckbox.length).toEqual(shapes.length);
		// remove the first checkBox assumed to be oval shape

		shapeCheckbox.slice(3).forEach(async (each) => {
			await fireEvent.click(each as HTMLInputElement);
			// expect(each.hasAttribute('checked')).toBeTruthy();
		});

		expect((await message).textContent).toBe('Multiple red Items');
	});

	test('When multiple the colors and single shape is selected: “Multiple oval items"', async () => {
		const { getByTestId, findByText, findByTestId, getAllByTestId } = render(
			<App />,
		);
		const input = getByTestId(/login/i);
		fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });

		const message = findByTestId(/message/i);

		expect((await message).textContent).toEqual('All Items');

		// single color
		const colorCheckBox = getAllByTestId(/color-checkbox/i);

		expect(colorCheckBox.length).toEqual(colors.length);
		// remove the first checkBox assumed to be red color
		colorCheckBox.slice(3).forEach(async (each: any) => {
			await fireEvent.click(each as HTMLInputElement);
			// expect(each.hasAttribute('checked')).toBeTruthy();
		});

		// multiple shapes
		const shapeCheckbox = getAllByTestId(/shape-checkbox/i);

		expect(shapeCheckbox.length).toEqual(shapes.length);
		// remove the first checkBox assumed to be oval shape
		shapeCheckbox.slice(1).forEach(async (each: any) => {
			await fireEvent.click(each as HTMLInputElement);
		});

		expect((await message).textContent).toBe('Multiple Oval Items');
	});

	test('When a single color and single shape is selected: “Round oval items"', async () => {
		const { getByTestId, findByText, findByTestId, getAllByTestId } = render(
			<App />,
		);
		const input = getByTestId(/login/i);
		fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);
		expect((await message).textContent).toEqual('All Items');
		// single color
		const colorCheckBox = getAllByTestId(/color-checkbox/i);
		expect(colorCheckBox.length).toEqual(colors.length);
		// remove the first checkBox assumed to be red color
		colorCheckBox.slice(1).forEach(async (each: any) => {
			await fireEvent.click(each as HTMLInputElement);
			// expect(each.hasAttribute('checked')).toBeTruthy();
		});

		// multiple shapes
		const shapeCheckbox = getAllByTestId(/shape-checkbox/i);
		expect(shapeCheckbox.length).toEqual(shapes.length);
		// remove the first checkBox assumed to be oval shape
		shapeCheckbox.slice(1).forEach(async (each: any) => {
			await fireEvent.click(each as HTMLInputElement);
			// expect(each.hasAttribute('checked')).toBeTruthy();
		});

		// debug(await message);
		expect(await message).toHaveTextContent('Oval red items');
	});

	test('check any color in the color filter', async () => {
		const {
			getByTestId,
			findByText,
			findByTestId,
			getAllByTestId,
			findAllByTestId,
		} = render(<App />);
		const input = getByTestId(/login/i);
		fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);
		expect((await message).textContent).toEqual('All Items');
		// single color
		let colorCheckBox = getAllByTestId(/color-checkbox/i);
		expect(colorCheckBox.length).toEqual(colors.length);
		// check everything but the last one
		colorCheckBox.slice(1).forEach(async (each) => {
			await fireEvent.click(each as HTMLElement);
		});
		// uncheck everything
		colorCheckBox.slice(1).forEach(async (each) => {
			await fireEvent.click(each as HTMLElement);
		});

		// fireEvent.click(colorCheckBox[0]);

		colorCheckBox = await findAllByTestId(/color-checkbox/i);

		let allSelectedAgain = colorCheckBox.every((each) => {
			let parent = each.parentElement as HTMLElement;
			return parent?.classList.contains('current');
		});

		expect(allSelectedAgain).toEqual(true);
	});

	test('check any shape in the shape filter', async () => {
		const {
			getByTestId,
			findByText,
			findByTestId,
			getAllByTestId,
			findAllByTestId,
		} = render(<App />);
		const input = getByTestId(/login/i);
		fireEvent.click(input);
		await findByText(/welcome/i, { selector: 'p' });
		const message = findByTestId(/message/i);
		expect((await message).textContent).toEqual('All Items');
		// single color
		let shapeCheckBox = getAllByTestId(/shape-checkbox/i);
		expect(shapeCheckBox.length).toEqual(shapes.length);
		// check everything but the last one
		shapeCheckBox.slice(1).forEach(async (each) => {
			await fireEvent.click(each as HTMLInputElement);
		});

		shapeCheckBox.slice(1).forEach(async (each) => {
			await fireEvent.click(each as HTMLInputElement);
		});

		shapeCheckBox = await findAllByTestId(/shape-checkbox/i);

		let allSelectedAgain = shapeCheckBox.every((each) => {
			let parent = each.parentElement as HTMLElement;
			return parent?.classList.contains('current');
		});

		expect(allSelectedAgain).toBeTruthy();
	});
});
