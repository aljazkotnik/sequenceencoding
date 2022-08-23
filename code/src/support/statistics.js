export function spearman(x,y){
  // The inputs are two variable arrays, which are expected to also have a 'mu' and 'sigma' property.
  // Get Spearman's rank correlation scores for the order in the x direction.
  // (https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient)
  // The coefficient is
  // covariance (x_rank, y_rank ) / ( sigma(rank_x) sigma(rank_y) )
  
  // First precalculate some statistics:
  x = calcStatistics(x);
  y = calcStatistics(y);
  return covariance(x,y) / ( x.sigma*y.sigma )
} // spearman

export function calcStatistics(A){
  // Give array A the mean, standard deviation, and name properties.
  A.mu = mean(A);
  A.sigma = variance(A)**0.5;
  A.sigma = A.sigma == 0 ? Infinity : A.sigma;
  return A
} // variable


export function covariance(x,y){
	// 'd' is an array of observations. Calculate the covariance between x and the metadata variable.
	let N = x.length
	let s = 0;
	for(var i=0; i< N; i++) {
		s += ( x[i] - x.mu )*( y[i] - y.mu );
	}
	return 1/(N - 1)*s
} // covariance

export function variance(x){
	// variance is a special case of covariance.
	return covariance(x,x)
} // variance

export function median(numbers) {
	// https://stackoverflow.com/questions/45309447/calculating-median-javascript
    let sorted = numbers.slice().sort((a, b) => a - b);
    let middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
} // median

export function mean(d){
	return sum(d)/d.length;
} // mean

export function sum(objarray, accessor){
	let _accessor = accessor ? accessor : function(d){return d};
	return objarray.reduce((acc,obj)=>{
		return acc += _accessor(obj)
	},0)
} // sum



export function range(A){
	// Math.min wants separate inputs.
	return A.reduce((acc, v)=>{
		acc[0] = v < acc[0] ? v : acc[0]
		acc[1] = v > acc[1] ? v : acc[1]
		return acc
	}, [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])
} // min