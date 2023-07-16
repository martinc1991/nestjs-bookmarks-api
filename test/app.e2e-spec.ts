import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'user@fromtest.com',
      password: 'fromtest',
    };

    describe('Signup', () => {
      const ENDPOINT = '/auth/signup';
      it('should throw an exception if not body is provided', () => {
        return pactum.spec().post(ENDPOINT).expectStatus(400);
      });
      it('should throw an exception if email is empty', () => {
        return pactum
          .spec()
          .post(ENDPOINT)
          .withBody({ ...dto, email: '' })
          .expectStatus(400);
      });
      it('should throw an exception if password is empty', () => {
        return pactum
          .spec()
          .post(ENDPOINT)
          .withBody({ ...dto, password: '' })
          .expectStatus(400);
      });
      it('should sign up', () => {
        return pactum.spec().post(ENDPOINT).withBody(dto).expectStatus(201);
      });
    });
    describe('Signin', () => {
      const ENDPOINT = '/auth/signin';
      it('should throw an exception if not body is provided', () => {
        return pactum.spec().post(ENDPOINT).expectStatus(400);
      });
      it('should throw an exception if email is empty', () => {
        return pactum
          .spec()
          .post(ENDPOINT)
          .withBody({ ...dto, email: '' })
          .expectStatus(400);
      });
      it('should throw an exception if password is empty', () => {
        return pactum
          .spec()
          .post(ENDPOINT)
          .withBody({ ...dto, password: '' })
          .expectStatus(400);
      });
      it('should sign in', () => {
        return pactum
          .spec()
          .post(ENDPOINT)
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });
  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withBearerToken('$S{userAt}')
          .expectStatus(200);
      });
    });
    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Another First Name',
          email: 'anothermeail@email.com',
        };
        return pactum
          .spec()
          .patch('/users')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });
  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectBody([]);
      });
    });
    describe('Create bookmarks', () => {
      it('should create bookmarks', () => {
        const dto: CreateBookmarkDto = {
          title: 'First Bookmark',
          link: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
        };
        return pactum
          .spec()
          .post('/bookmarks')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });
    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectJsonLength(1);
      });
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
          .inspect();
      });
    });

    // describe('Get bookmark by id', () => {});
    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'Edited title',
        description: 'Edited description',
      };
      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });
    describe('Delete bookmark by id', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .expectStatus(204);
      });

      it('should get empty bookmarks again', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectBody([]);
      });
    });
  });
});
