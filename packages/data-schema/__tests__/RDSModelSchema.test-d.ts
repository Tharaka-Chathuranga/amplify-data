import type {
  DataSourceConfiguration,
  Equal,
  Expect,
  Prettify,
} from '@aws-amplify/data-schema-types';
import {
  AuthMode,
  CustomHeaders,
  ListReturnValue,
  SingularReturnValue,
} from '../src/runtime';
import { type ClientSchema, a } from '../src/index';
import { configure } from '../src/ModelSchema';

describe('RDSModelSchema', () => {
  const schema = configure({
    database: {
      engine: 'mysql',
      connectionUri: 'fake' as any,
    },
  })
    .schema({
      Post: a.model({
        title: a.string().required(),
        content: a.string(),
        parentBlogId: a.string(),
      }),
      Blog: a.model({
        title: a.string().required(),
        description: a.string(),
      }),
    })
    .authorization((allow) => allow.publicApiKey())
    .setRelationships((models) => [
      models.Post.relationships({
        parentBlog: a.belongsTo('Blog', 'parentBlogId'),
      }),
      models.Blog.relationships({
        childPosts: a.hasMany('Post', 'parentBlogId'),
      }),
    ]);

  type Schema = ClientSchema<typeof schema>;

  describe('.setRelationships() modifier', () => {
    it('inserts model relation fields into target models', () => {
      type ResolvedPost = Prettify<Schema['Post']['type']>;
      type ResolvedBlog = Prettify<Schema['Blog']['type']>;

      type ExpectedPostShape = {
        title: string;
        parentBlog: (
          options?:
            | {
                authMode?: AuthMode | undefined;
                authToken?: string | undefined;
                headers?: CustomHeaders | undefined;
              }
            | undefined,
        ) => SingularReturnValue<any>;
        content?: string | null | undefined;
      };
      type ExpectedBlogShape = {
        title: string;
        childPosts: (
          options?:
            | {
                authMode?: AuthMode | undefined;
                authToken?: string | undefined;
                limit?: number | undefined;
                nextToken?: string | null | undefined;
                headers?: CustomHeaders | undefined;
              }
            | undefined,
        ) => ListReturnValue<any>;
        description?: string | null | undefined;
      };

      type ValidPost = ResolvedPost extends ExpectedPostShape ? true : false;
      type ValidBlog = ResolvedBlog extends ExpectedBlogShape ? true : false;

      type _PostValidation = Expect<Equal<ValidPost, true>>;
      type _BlogValidation = Expect<Equal<ValidBlog, true>>;
    });
  });

  describe('database authentication configuration', () => {
    const fakeSecret = () => ({}) as any;

    it('accepts the supported SQL authentication strategies', () => {
      configure({
        database: {
          engine: 'postgresql',
          connectionUri: fakeSecret(),
          authentication: { strategy: 'rdsIam' },
        },
      });

      configure({
        database: {
          engine: 'mysql',
          connectionUri: fakeSecret(),
          authentication: { strategy: 'rdsIam' },
        },
      });

      configure({
        database: {
          engine: 'postgresql',
          connectionUri: fakeSecret(),
          authentication: { strategy: 'password' },
        },
      });

      configure({
        database: {
          engine: 'postgresql',
          connectionUri: fakeSecret(),
        },
      });
    });

    it('rejects unknown authentication strategies', () => {
      configure({
        database: {
          engine: 'postgresql',
          connectionUri: fakeSecret(),
          // @ts-expect-error - only 'password' and 'rdsIam' are supported
          authentication: { strategy: 'iam' },
        },
      });

      configure({
        database: {
          engine: 'postgresql',
          connectionUri: fakeSecret(),
          // @ts-expect-error - strategy is required when authentication is set
          authentication: {},
        },
      });
    });

    it('rejects authentication for DynamoDB', () => {
      configure({
        database: {
          engine: 'dynamodb',
          // @ts-expect-error - authentication is only supported for SQL data sources
          authentication: { strategy: 'rdsIam' },
        },
      });
    });

    it('exposes the authentication strategy on the SQL DataSourceConfiguration type', () => {
      type PgStrategy = NonNullable<
        DataSourceConfiguration<'postgresql'>['authentication']
      >['strategy'];
      type MySqlStrategy = NonNullable<
        DataSourceConfiguration<'mysql'>['authentication']
      >['strategy'];

      type _pg = Expect<Equal<PgStrategy, 'password' | 'rdsIam'>>;
      type _mysql = Expect<Equal<MySqlStrategy, 'password' | 'rdsIam'>>;
      type _ddb = Expect<
        Equal<
          'authentication' extends keyof DataSourceConfiguration<'dynamodb'>
            ? true
            : false,
          false
        >
      >;
    });
  });
});
