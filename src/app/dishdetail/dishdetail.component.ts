import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';

import { Comment } from '../shared/comment';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss']
})
export class DishdetailComponent implements OnInit {

  @ViewChild('fform') commentFormDirective;

  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  disabled: boolean = false;
  showPreview: boolean;
  errMess: string;
  preview: Comment;
  comment: Comment;
  dishcopy: Dish;

  commentForm: FormGroup;

  formErrors = {
    'author': '',
    'rating': '',
    'comment': ''
  };

  validationMessages = {
    'author': {
      'required':      'Name is required.',
      'minlength':     'Name must be at least 2 characters long.',
      'maxlength':     'Name cannot be more than 25 characters long.'
    },
    'rating': {
      'required':      'Rating is required.',
      'min':     'Rating must be at least 0.',
      'max':     'Rating cannot be more than 5.'
    },
    'comment': {
      'required':      'Comment is required.',
      'minlength':     'Comment must be at least 5 characters long.',
    },
  };

  constructor(private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL') private BaseURL) { }

  ngOnInit() {
    this.dishService.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
    this.route.params
      .pipe(switchMap((params: Params) => this.dishService.getDish(params['id'])))
      .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); },
        errmess => this.errMess = <any>errmess );

    this.preview = new Comment;

      this.createForm();
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }

  createForm() {
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)] ],
      rating: ['5', [Validators.required, Validators.min(0), Validators.max(5)] ],
      comment: ['', [Validators.required, Validators.minLength(5)] ],
    });

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;

    let valid = true;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
    this.displayPreview();
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    console.log(this.comment);

    this.comment = new Comment;
    this.comment.author = this.commentForm.controls.author.value;
    this.comment.rating = this.commentForm.controls.rating.value;
    this.comment.comment = this.commentForm.controls.comment.value;
    this.comment.date = new Date().toISOString();

    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });

    this.showPreview = false;

    this.commentForm.reset({
      author: '',
      rating: 5,
      comment: '',
    });

    this.commentFormDirective.resetForm({
      author: '',
      rating: 5,
      comment: '',
    });
  }

  displayPreview() {
    this.preview.author = this.commentForm.controls.author.value;
    this.preview.rating = this.commentForm.controls.rating.value;
    this.preview.comment = this.commentForm.controls.comment.value;
  }

}
