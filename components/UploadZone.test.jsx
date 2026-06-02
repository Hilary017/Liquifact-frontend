import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadZone from './UploadZone';

describe('UploadZone', () => {
  test('renders initial state with file input and disabled submit button', () => {
    render(<UploadZone />);
    
    expect(screen.getByLabelText(/Select PDF invoice file/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload & Tokenize Invoice/i)).toBeDisabled();
  });

  test('accepts valid PDF file and enables submit', () => {
    render(<UploadZone />);
    const fileInput = screen.getByLabelText(/Select PDF invoice file/i);
    
    const validFile = new File(['dummy pdf content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Upload & Tokenize Invoice/i)).not.toBeDisabled();
  });

  test('rejects non-PDF file and shows error', () => {
    render(<UploadZone />);
    const fileInput = screen.getByLabelText(/Select PDF invoice file/i);
    
    const invalidFile = new File(['dummy text'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    expect(screen.getByRole('alert')).toHaveTextContent(/Only PDF files are accepted/i);
    expect(screen.getByText(/Upload & Tokenize Invoice/i)).toBeDisabled();
  });

  test('rejects file larger than 10MB and shows error', () => {
    render(<UploadZone />);
    const fileInput = screen.getByLabelText(/Select PDF invoice file/i);
    
    const oversizedFile = new File(['a'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
    
    expect(screen.getByRole('alert')).toHaveTextContent(/exceeds the 10 MB limit/i);
    expect(screen.getByText(/Upload & Tokenize Invoice/i)).toBeDisabled();
  });

  test('accepts file exactly 10MB', () => {
    render(<UploadZone />);
    const fileInput = screen.getByLabelText(/Select PDF invoice file/i);
    
    const exactSizeFile = new File(['a'.repeat(10 * 1024 * 1024)], 'exact.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [exactSizeFile] } });
    
    expect(screen.getByText('exact.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Upload & Tokenize Invoice/i)).not.toBeDisabled();
  });

  test('shows success status when form is submitted', () => {
    render(<UploadZone />);
    const fileInput = screen.getByLabelText(/Select PDF invoice file/i);
    const submitButton = screen.getByText(/Upload & Tokenize Invoice/i);
    
    const validFile = new File(['dummy pdf content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    fireEvent.click(submitButton);
    
    expect(screen.getByRole('status')).toHaveTextContent(/Invoice queued for tokenization/i);
  });

  test('triggers file input on Enter key', () => {
    render(<UploadZone />);
    const fileInput = screen.getByLabelText(/Select PDF invoice file/i);
    const dropZone = screen.getByLabelText(/Drop PDF invoice here or press Enter to browse files/i);
    
    const clickSpy = jest.spyOn(fileInput, 'click');
    fireEvent.keyDown(dropZone, { key: 'Enter', code: 'Enter' });
    
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  test('triggers file input on Space key', () => {
    render(<UploadZone />);
    const fileInput = screen.getByLabelText(/Select PDF invoice file/i);
    const dropZone = screen.getByLabelText(/Drop PDF invoice here or press Enter to browse files/i);
    
    const clickSpy = jest.spyOn(fileInput, 'click');
    fireEvent.keyDown(dropZone, { key: ' ', code: 'Space' });
    
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});