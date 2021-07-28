class ApiFeatures {
  constructor(query, queryString) {
    //this function gets automatically called as soon as we create new object
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString }; //destructures the fields in req.query
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    //  1.b) Advanced filtering for gte,gt,lte,le
    // {difficulty: "easy", duration: {$gte: 5}}     =>but in queryObj there will be gte
    //so we must change gte into $gte

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //This is called regular expression
    console.log(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));
    return this; //this means the entire object
    //we use return so that the objects can we returned to get chained in the feature variable
  }

  sort() {
    if (this.queryString.sort) {
      //if the first criteria is same,to add second criteria
      //in mongoose it works as {price, ratingsAverage}
      const sortBy = this.queryString.sort.split(',').join(' ');
      // slice(',') splits the value of sort with a comma
      //join(' ') then joins them

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    } //this is done by default if user does not specify which sort
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
      // - excludes the fields
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; //which means either the given page number or 1 by default
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=3&limit=10, page-1= 1-10,page2=11-20 and so on
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;