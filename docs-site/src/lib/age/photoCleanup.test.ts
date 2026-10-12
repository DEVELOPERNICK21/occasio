import { deleteUserPhotos, type BucketLike } from './photoCleanup';

function fakeBucket(exists: boolean) {
  const deleted: string[] = [];
  const prefixes: string[] = [];
  const bucket: BucketLike = {
    exists: async () => [exists],
    deleteFiles: async ({ prefix }) => {
      prefixes.push(prefix);
    },
    file: (path) => ({
      delete: async () => {
        deleted.push(path);
      },
    }),
  };
  return { bucket, deleted, prefixes };
}

describe('deleteUserPhotos', () => {
  it('does nothing, and does not fail, when the project has no Storage bucket', async () => {
    const { bucket, deleted, prefixes } = fakeBucket(false);

    await expect(deleteUserPhotos(bucket, 'u1', ['uploads/old/a.jpg'])).resolves.toBeUndefined();

    expect(prefixes).toEqual([]);
    expect(deleted).toEqual([]);
  });

  it("removes everything under the user's folder, plus older photos named by their cards", async () => {
    const { bucket, deleted, prefixes } = fakeBucket(true);

    await deleteUserPhotos(bucket, 'u1', ['uploads/legacy/a.jpg', 'uploads/legacy/b.jpg']);

    expect(prefixes).toEqual(['uploads/u1/']);
    expect(deleted).toEqual(['uploads/legacy/a.jpg', 'uploads/legacy/b.jpg']);
  });

  it('still fails when Storage fails for any other reason, so nothing is erased half-way', async () => {
    const { bucket } = fakeBucket(true);
    bucket.deleteFiles = async () => {
      throw new Error('permission denied');
    };

    await expect(deleteUserPhotos(bucket, 'u1', [])).rejects.toThrow('permission denied');
  });

  it('fails rather than guessing when it cannot tell whether the bucket exists', async () => {
    const { bucket } = fakeBucket(true);
    bucket.exists = async () => {
      throw new Error('network down');
    };

    await expect(deleteUserPhotos(bucket, 'u1', [])).rejects.toThrow('network down');
  });
});
