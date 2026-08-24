import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

interface Book {
  id: number;
  title: string;
  author: string;
  publicationDate: string;
}

interface Quote {
  id: number;
  text: string;
  author: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {isDarkMode = false;toggleTheme() {
  this.isDarkMode = !this.isDarkMode;

  if (this.isDarkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}
  books: Book[] = [];

  showForm = false;
  title = '';
  author = '';
  publicationDate = '';
  editingId: number | null = null;

  username = '';
  password = '';
  isLoggedIn = false;
  authMessage = '';

  currentView: 'books' | 'quotes' = 'books';

  quotes: Quote[] = [
    {
      id: 1,
      text: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs'
    },
    {
      id: 2,
      text: 'Believe you can and you are halfway there.',
      author: 'Theodore Roosevelt'
    },
    {
      id: 3,
      text: 'It always seems impossible until it is done.',
      author: 'Nelson Mandela'
    },
    {
      id: 4,
      text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
      author: 'Winston Churchill'
    },
    {
      id: 5,
      text: 'The future depends on what you do today.',
      author: 'Mahatma Gandhi'
    }
  ];

  quoteText = '';
  quoteAuthor = '';
  showQuoteForm = false;
  editingQuoteId: number | null = null;

  private apiUrl = 'http://localhost:5174/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('token');

    if (token) {
      this.isLoggedIn = true;
      this.loadBooks();
    }
  }

  register() {
    this.http.post(
      `${this.apiUrl}/register`,
      {
        username: this.username,
        password: this.password
      }
    ).subscribe({
      next: () => {
        this.authMessage = 'Registration successful. You can now log in.';
      },
      error: () => {
        this.authMessage = 'Registration failed.';
      }
    });
  }

  login() {
    this.http.post<{ token: string }>(
      `${this.apiUrl}/login`,
      {
        username: this.username,
        password: this.password
      }
    ).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);

        this.isLoggedIn = true;
        this.authMessage = '';
        this.username = '';
        this.password = '';

        this.loadBooks();
      },
      error: () => {
        this.authMessage = 'Invalid username or password.';
      }
    });
  }

  logout() {
    localStorage.removeItem('token');

    this.isLoggedIn = false;
    this.books = [];
    this.username = '';
    this.password = '';
    this.currentView = 'books';
  }

  private getHeaders() {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  showBooks() {
    this.currentView = 'books';
  }

  showQuotes() {
    this.currentView = 'quotes';
  }

  loadBooks() {
    this.http.get<Book[]>(
      `${this.apiUrl}/books`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({
      next: (data) => {
        this.books = data;
      },
      error: (error) => {
        console.error('Error loading books:', error);
      }
    });
  }

  openForm() {
    this.showForm = true;
    this.editingId = null;
    this.clearForm();
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.clearForm();
  }

  saveBook() {
    if (!this.title || !this.author || !this.publicationDate) {
      return;
    }

    const book = {
      id: this.editingId ?? 0,
      title: this.title,
      author: this.author,
      publicationDate: this.publicationDate
    };

    if (this.editingId === null) {
      this.http.post<Book>(
        `${this.apiUrl}/books`,
        book,
        {
          headers: this.getHeaders()
        }
      ).subscribe({
        next: () => {
          this.loadBooks();
          this.closeForm();
        }
      });
    } else {
      this.http.put<Book>(
        `${this.apiUrl}/books/${this.editingId}`,
        book,
        {
          headers: this.getHeaders()
        }
      ).subscribe({
        next: () => {
          this.loadBooks();
          this.closeForm();
        }
      });
    }
  }

  editBook(index: number) {
    const book = this.books[index];

    this.editingId = book.id;
    this.title = book.title;
    this.author = book.author;
    this.publicationDate = book.publicationDate;
    this.showForm = true;
  }

  deleteBook(index: number) {
    const book = this.books[index];

    this.http.delete(
      `${this.apiUrl}/books/${book.id}`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({
      next: () => {
        this.loadBooks();
      }
    });
  }

  clearForm() {
    this.title = '';
    this.author = '';
    this.publicationDate = '';
  }

  openQuoteForm() {
    this.showQuoteForm = true;
    this.editingQuoteId = null;
    this.clearQuoteForm();
  }

  closeQuoteForm() {
    this.showQuoteForm = false;
    this.editingQuoteId = null;
    this.clearQuoteForm();
  }

  saveQuote() {
    if (!this.quoteText || !this.quoteAuthor) {
      return;
    }

    if (this.editingQuoteId === null) {
      const newId =
        this.quotes.length === 0
          ? 1
          : Math.max(...this.quotes.map(q => q.id)) + 1;

      this.quotes.push({
        id: newId,
        text: this.quoteText,
        author: this.quoteAuthor
      });
    } else {
      const quote = this.quotes.find(
        q => q.id === this.editingQuoteId
      );

      if (quote) {
        quote.text = this.quoteText;
        quote.author = this.quoteAuthor;
      }
    }

    this.closeQuoteForm();
  }

  editQuote(index: number) {
    const quote = this.quotes[index];

    this.editingQuoteId = quote.id;
    this.quoteText = quote.text;
    this.quoteAuthor = quote.author;
    this.showQuoteForm = true;
  }

  deleteQuote(index: number) {
    this.quotes.splice(index, 1);
  }

  clearQuoteForm() {
    this.quoteText = '';
    this.quoteAuthor = '';
  }
}